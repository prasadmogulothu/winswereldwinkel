# Groenten module - local static server + JSON write endpoints.
# Uses System.Net.HttpListener, built into Windows. No Node, no Python, nothing to install.
# The http://localhost:<port>/ prefix binds without administrator rights.

$ErrorActionPreference = 'Stop'

$Root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir   = Join-Path $Root 'app'
$DataDir  = Join-Path $Root 'data'
$PhotoDir = Join-Path $AppDir 'photos'
$Port     = 8777

foreach ($d in @($DataDir, $PhotoDir)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

$Mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.webp' = 'image/webp'
  '.woff2'= 'font/woff2'
  '.woff' = 'font/woff'
  '.txt'  = 'text/plain; charset=utf-8'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  # ${Port} braces required: a bare colon after a variable is PowerShell's
  # scope separator, so "$Port:" fails to parse.
  Write-Host "Could not open port ${Port}: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Is a Groenten server already running? Close that one first." -ForegroundColor Yellow
  exit 1
}
Write-Host "Groenten running on http://localhost:$Port  (Ctrl+C to stop)" -ForegroundColor Green

# Resolve a request path to a real file inside $base, or $null if it escapes the folder.
function Resolve-Safe([string]$base, [string]$relative) {
  $clean = $relative.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  if ([string]::IsNullOrWhiteSpace($clean)) { return $null }
  $full = [IO.Path]::GetFullPath((Join-Path $base $clean))
  $baseFull = [IO.Path]::GetFullPath($base)
  if (-not $full.StartsWith($baseFull, [StringComparison]::OrdinalIgnoreCase)) { return $null }
  return $full
}

function Send-Bytes($resp, [byte[]]$bytes, [string]$type, [int]$status = 200) {
  $resp.StatusCode = $status
  $resp.ContentType = $type
  $resp.ContentLength64 = $bytes.Length
  $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  $resp.OutputStream.Close()
}

function Send-Text($resp, [string]$text, [string]$type = 'text/plain; charset=utf-8', [int]$status = 200) {
  Send-Bytes $resp ([Text.Encoding]::UTF8.GetBytes($text)) $type $status
}

function Read-Body($req) {
  $reader = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
  try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

# Write via a temp file then move, so a crash mid-write can never leave a half-written price list.
function Write-Atomic([string]$path, [string]$content) {
  $tmp = "$path.tmp"
  [IO.File]::WriteAllText($tmp, $content, (New-Object Text.UTF8Encoding($false)))
  [IO.File]::Copy($tmp, $path, $true)
  Remove-Item $tmp -Force
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $path = $req.Url.AbsolutePath
  $method = $req.HttpMethod

  try {
    # --- session ---------------------------------------------------------
    # The till stands behind the counter, so there is nobody to log in as.
    # The hosted version answers this same endpoint with a real check.
    if ($path -eq '/api/session') {
      if ($method -eq 'DELETE') { Send-Text $res '{"ok":true}' 'application/json; charset=utf-8'; continue }
      Send-Text $res '{"admin":true,"canSave":true}' 'application/json; charset=utf-8'
      continue
    }

    # --- price list ------------------------------------------------------
    if ($method -eq 'GET' -and $path -eq '/api/products') {
      $res.Headers.Add('Cache-Control', 'no-store')
      Send-Bytes $res ([IO.File]::ReadAllBytes((Join-Path $DataDir 'products.json'))) 'application/json; charset=utf-8'
      continue
    }

    if ($method -eq 'PUT' -and $path -eq '/api/products') {
      $body = Read-Body $req
      # Parse before writing: a malformed body must never replace the price list.
      $null = $body | ConvertFrom-Json
      Write-Atomic (Join-Path $DataDir 'products.json') $body
      Send-Text $res '{"ok":true}' 'application/json; charset=utf-8'
      continue
    }

    if ($method -eq 'POST' -and $path -eq '/api/sale') {
      $body = Read-Body $req
      $null = $body | ConvertFrom-Json
      $line = ($body -replace "`r?`n", ' ')
      Add-Content -Path (Join-Path $DataDir 'sales.jsonl') -Value $line -Encoding utf8
      Send-Text $res '{"ok":true}' 'application/json; charset=utf-8'
      continue
    }

    if (($method -eq 'POST' -or $method -eq 'PUT') -and $path -eq '/api/photo') {
      $id = $req.QueryString['id']
      if ($id -notmatch '^[a-z0-9\-]{1,60}$') { Send-Text $res '{"error":"Invalid id."}' 'application/json; charset=utf-8' 400; continue }
      $ms = New-Object IO.MemoryStream
      $req.InputStream.CopyTo($ms)
      [IO.File]::WriteAllBytes((Join-Path $PhotoDir "$id.jpg"), $ms.ToArray())
      # No url in the reply: locally the photo is served straight from app\photos.
      Send-Text $res '{"ok":true}' 'application/json; charset=utf-8'
      continue
    }

    # --- static ----------------------------------------------------------
    if ($method -ne 'GET') { Send-Text $res 'method not allowed' 'text/plain' 405; continue }

    if ($path -like '/data/*') {
      $file = Resolve-Safe $DataDir $path.Substring('/data'.Length)
    } else {
      if ($path -eq '/') { $path = '/index.html' }
      $file = Resolve-Safe $AppDir $path
    }

    if ($null -eq $file -or -not (Test-Path $file -PathType Leaf)) {
      Send-Text $res 'not found' 'text/plain; charset=utf-8' 404
      continue
    }

    $ext = [IO.Path]::GetExtension($file).ToLower()
    $type = if ($Mime.ContainsKey($ext)) { $Mime[$ext] } else { 'application/octet-stream' }
    # No caching: the owner edits prices and expects to see them, not a stale copy.
    $res.Headers.Add('Cache-Control', 'no-store')
    Send-Bytes $res ([IO.File]::ReadAllBytes($file)) $type
  }
  catch {
    Write-Host "Error on $method $path : $($_.Exception.Message)" -ForegroundColor Red
    try { Send-Text $res "server error: $($_.Exception.Message)" 'text/plain; charset=utf-8' 500 } catch {}
  }
}
