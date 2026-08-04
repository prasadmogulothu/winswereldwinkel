# One-off: pull produce photos from Wikimedia Commons, centre-crop to a square
# and save as 400x400 JPEG in app/photos/.
#
# Needs the internet ONLY while it runs. The shop till never does - once the
# photos are on disk the module is fully offline.
#
# Re-runnable: files that already exist are skipped, so you can top up after
# adding vegetables. Pass -Force to redownload everything.
#
#   powershell -ExecutionPolicy Bypass -File tools\fetch-photos.ps1
#   powershell -ExecutionPolicy Bypass -File tools\fetch-photos.ps1 -Only okra,yam

param(
  [string[]]$Only,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Drawing

$Root     = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PhotoDir = Join-Path $Root 'app\photos'
$Products = (Get-Content (Join-Path $Root 'data\products.json') -Raw | ConvertFrom-Json).products
$Api      = 'https://commons.wikimedia.org/w/api.php'
# Commons asks for a descriptive User-Agent with a contact. Without one you get
# throttled hard, which is exactly what happened the first time this was run.
$UA       = 'WereldSupermarktGroenten/1.0 (https://github.com/wereld-supermarkt; offline shop signage) PowerShell'
$SIDE     = 400
$PAUSE_MS = 1200   # be a good citizen; Commons rate-limits anonymous bursts

if (-not (Test-Path $PhotoDir)) { New-Item -ItemType Directory -Path $PhotoDir | Out-Null }

# `powershell -File x.ps1 -Only a,b` hands us the single string "a,b", not an
# array, so split it ourselves rather than silently matching nothing.
if ($Only) { $Only = $Only -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ } }

# Ask Commons for photos matching a term. Returns candidates by relevance.
# Retries on 429 with backoff - a throttled request is not a missing photo, and
# treating it as one is how the first run "found" nothing for 40 vegetables.
function Find-CommonsImages([string]$term) {
  $q = [Uri]::EscapeDataString($term)
  $url = "$Api`?action=query&generator=search&gsrsearch=filetype%3Abitmap%20$q" +
         "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url%7Cextmetadata" +
         "&iiurlwidth=800&format=json"

  $r = $null
  foreach ($attempt in 1..4) {
    try {
      $r = Invoke-RestMethod -Uri $url -UserAgent $UA -TimeoutSec 30
      break
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -eq 429 -and $attempt -lt 4) {
        $wait = 5 * $attempt
        Write-Host "  [429, $wait s wait]" -NoNewline -ForegroundColor DarkGray
        Start-Sleep -Seconds $wait
        continue
      }
      return @()
    }
  }
  if (-not $r -or -not $r.query.pages) { return @() }
  $r.query.pages.PSObject.Properties.Value | ForEach-Object {
    $ii = $_.imageinfo[0]
    if (-not $ii) { return }
    [pscustomobject]@{
      title   = $_.title
      thumb   = $ii.thumburl
      license = $ii.extmetadata.LicenseShortName.value
      artist  = ($ii.extmetadata.Artist.value -replace '<[^>]+>', '').Trim()
      page    = $ii.descriptionurl
    }
  }
}

# Commons' top hit is often a botanical plate, a field of plants, or the wrong
# species entirely. On a sell screen a wrong photo is worse than no photo -
# staff pick by picture - so score candidates instead of taking the first.
$REJECT = 'diagram|illustration|drawing|sketch|painting|plate|k(o|oe|ö)hler|herbari|' +
          'distribution|map|logo|icon|chart|graph|stamp|coin|flag|sign|label|' +
          'seedling|sprout|flower|blossom|cross.?section|microscop|nutrition|' +
          # A cooked dish is not the raw vegetable the customer is buying.
          'cooked|boiled|fried|roast|grill|salad|soup|stew|recipe|meal|dinner|' +
          'lunch|dish|pickle|juice|puree|mashed|dried|powder|canned|frozen|' +
          # Real hits from earlier runs: "Red Hot Chili Peppers" (the band) for
          # red chilli, and a cabbage-white butterfly for white cabbage.
          'band|concert|guitar|music|album|festival|player|singer|' +
          'butterfly|moth|caterpillar|insect|beetle|aphid|larva|pest|' +
          'micrograph|cell|pollen|chromosom|seeds?\b|germinat'

function Score-Candidate($cand, [string]$headWord, [bool]$leafy) {
  $t = $cand.title -replace '^File:', ''
  if ($t -match $REJECT) { return -100 }

  $score = 0
  if ($headWord -and $t -match [regex]::Escape($headWord)) { $score += 10 }
  # Close-ups of the produce itself beat field shots and taxonomy plates.
  if ($t -match 'basket|bunch|harvest|fresh|whole|pile|crate|heap|closeup|close.?up') { $score += 4 }
  if ($t -match 'vegetable|produce|food|fruit') { $score += 2 }
  # "market" and "shop" mostly return whole-stall scenes with twenty products
  # in frame, which is useless on a tile the size of a matchbox.
  if ($t -match 'market|stall|shop|supermarket|bazaar|vendor') { $score -= 5 }
  # Long Latin-binomial filenames are almost always taxonomy photos of foliage.
  if ($t -match '^[A-Z][a-z]+ [a-z]+ ') { $score -= 3 }
  if ($t -match 'plant|tree|vine|field|garden|farm') { $score -= 4 }
  # For spinach and coriander the leaves ARE the product, so no penalty there.
  if (-not $leafy -and $t -match 'leaves|leaf|foliage') { $score -= 4 }
  return $score
}

# Centre-crop to a square, then scale. Keeps the vegetable in frame; a squashed
# aspect ratio makes produce genuinely hard to recognise on a tile.
function Save-Square([byte[]]$bytes, [string]$outPath) {
  $ms = New-Object IO.MemoryStream(, $bytes)
  $src = [Drawing.Image]::FromStream($ms)
  try {
    # NOT $side: PowerShell variable names are case-insensitive, so a local
    # $side would silently clobber the $SIDE constant and save at source size.
    $cropSide = [Math]::Min($src.Width, $src.Height)
    $x = [int](($src.Width - $cropSide) / 2)
    $y = [int](($src.Height - $cropSide) / 2)

    $bmp = New-Object Drawing.Bitmap($SIDE, $SIDE)
    $g = [Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, (New-Object Drawing.Rectangle(0, 0, $SIDE, $SIDE)),
                 $x, $y, $cropSide, $cropSide, [Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object Drawing.Imaging.EncoderParameter(
      [Drawing.Imaging.Encoder]::Quality, 85)
    $bmp.Save($outPath, $codec, $params)
    $bmp.Dispose()
  } finally {
    $src.Dispose(); $ms.Dispose()
  }
}

$credits = @()
$missing = @()
$got = 0
$skipped = 0

foreach ($p in $Products) {
  if ($Only -and ($Only -notcontains $p.id)) { continue }
  $out = Join-Path $PhotoDir "$($p.id).jpg"
  if ((Test-Path $out) -and -not $Force) { $skipped++; continue }

  $term = if ($p.search) { $p.search } else { $p.en }
  Write-Host ("{0,-24} {1}" -f $p.id, $term) -NoNewline

  $leafy = $p.category -in @('bladgroen', 'kruiden')
  $head = ($p.en -split '[ /]')[0]

  $ranked = Find-CommonsImages $term |
            Where-Object { $_.thumb } |
            ForEach-Object {
              $_ | Add-Member -NotePropertyName score -NotePropertyValue (Score-Candidate $_ $head $leafy) -PassThru
            } |
            Where-Object { $_.score -gt -100 } |
            Sort-Object score -Descending

  $hit = $null
  foreach ($cand in $ranked) {
    try {
      $bytes = (Invoke-WebRequest -Uri $cand.thumb -UserAgent $UA -TimeoutSec 30 -UseBasicParsing).Content
      Save-Square $bytes $out
      $hit = $cand
      break
    } catch {
      continue
    }
  }

  if ($hit) {
    Write-Host "  OK" -ForegroundColor Green
    $credits += "- $($p.nl) [$($p.id).jpg] - $($hit.title), $($hit.license), $($hit.artist). $($hit.page)"
    $got++
  } else {
    Write-Host "  NOT FOUND" -ForegroundColor Yellow
    $missing += $p
  }
  Start-Sleep -Milliseconds $PAUSE_MS
}

if ($credits) {
  $header = @(
    '# Photo credits',
    '',
    'Photos from Wikimedia Commons, cropped to 400x400. Licences below.',
    'Photos uploaded through Admin are not listed here.',
    ''
  )
  $path = Join-Path $PhotoDir 'CREDITS.md'
  $existing = if (Test-Path $path) { Get-Content $path -Raw } else { '' }
  Set-Content -Path $path -Value (($header + $credits) -join "`r`n") -Encoding utf8
}

Write-Host ""
Write-Host "Downloaded: $got   Skipped (already had a photo): $skipped   Not found: $($missing.Count)"

if ($missing.Count) {
  Write-Host ""
  Write-Host "No photo found for these - take a phone photo via Admin:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host ("  - {0}  ({1})" -f $_.nl, $_.en) }
}
