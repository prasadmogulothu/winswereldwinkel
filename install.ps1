# Groenten module - one-line installer for the till PC.
#
#   powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/prasadmogulothu/winswereldwinkel/main/install.ps1 | iex"
#
# Downloads the current code from GitHub, unpacks it to C:\wereld-supermarkt and
# starts it. Nothing is installed into Windows. No administrator rights needed.
#
# Re-running it updates the code and KEEPS the existing price list.

param(
  [string]$Dest = 'C:\wereld-supermarkt',
  [switch]$NoStart
)

$ErrorActionPreference = 'Stop'

# Old POS boxes often still default to TLS 1.0, which GitHub refuses.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$zipUrl = 'https://codeload.github.com/prasadmogulothu/winswereldwinkel/zip/refs/heads/main'
$tmp    = Join-Path $env:TEMP ("groenten-" + [Guid]::NewGuid().ToString('N').Substring(0, 8))
$zip    = "$tmp.zip"

Write-Host ""
Write-Host "  Groenten module installer" -ForegroundColor Cyan
Write-Host "  -------------------------"
Write-Host ""

try {
  Write-Host "  Downloading..." -NoNewline
  Invoke-WebRequest -Uri $zipUrl -OutFile $zip -UseBasicParsing
  Write-Host " done ($([math]::Round((Get-Item $zip).Length / 1MB, 1)) MB)" -ForegroundColor Green

  Write-Host "  Unpacking..." -NoNewline
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  # The GitHub archive wraps everything in one folder named <repo>-<branch>.
  $src = Get-ChildItem $tmp -Directory | Select-Object -First 1
  if (-not $src) { throw "The downloaded archive was empty." }
  Write-Host " done" -ForegroundColor Green

  # The price list is the shop's real data and the only copy. An update must
  # never destroy it, so it is held aside and put back after the files land.
  $livePrices = Join-Path $Dest 'data\products.json'
  $saved = $null
  if (Test-Path $livePrices) {
    $saved = Join-Path $env:TEMP "products-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Copy-Item $livePrices $saved -Force
    Write-Host "  Existing price list kept safe: $saved" -ForegroundColor Yellow
  }

  Write-Host "  Installing to $Dest..." -NoNewline
  if (-not (Test-Path $Dest)) { New-Item -ItemType Directory -Path $Dest -Force | Out-Null }
  Copy-Item (Join-Path $src.FullName '*') $Dest -Recurse -Force
  Write-Host " done" -ForegroundColor Green

  if ($saved) {
    Copy-Item $saved $livePrices -Force
    Write-Host "  Price list restored." -ForegroundColor Green
  }

  # Files that arrive from the internet carry a mark that makes PowerShell refuse
  # to run them. Clear it, or serve.ps1 fails silently on first start.
  Get-ChildItem $Dest -Recurse -File | Unblock-File -ErrorAction SilentlyContinue

  Write-Host ""
  Write-Host "  Installed to $Dest" -ForegroundColor Green
  Write-Host ""

  if ($NoStart) {
    Write-Host "  Start it by double-clicking:  $Dest\start.bat"
  } else {
    Write-Host "  Starting..."
    Start-Process -FilePath (Join-Path $Dest 'start.bat') -WorkingDirectory $Dest
    Write-Host ""
    Write-Host "  Leave the small black window open - closing it stops the module."
  }

  Write-Host ""
  Write-Host "  BEFORE SELLING ANYTHING:" -ForegroundColor Yellow
  Write-Host "    1. Open $Dest\app\test.html - all 43 checks must be green"
  Write-Host "    2. Enter the real prices in Admin -> Weekly prices"
  Write-Host "    3. Read $Dest\till-setup.md (the 'groenten' key needs a fix in Hanka)"
  Write-Host ""
}
catch {
  Write-Host ""
  Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  Write-Host "  No internet on this PC? Use the USB stick route in till-setup.md."
  Write-Host ""
  exit 1
}
finally {
  Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
