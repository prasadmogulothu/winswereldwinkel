# Read whatever the DIGI DS-782 puts on its RS-232 line, and print it raw.
#
#   irm https://raw.githubusercontent.com/prasadmogulothu/winswereldwinkel/main/tools/scale-sniff.ps1 | iex
#
# Purpose: find the port, the baud rate and the frame format by looking at real
# bytes, instead of guessing a protocol and writing a parser on top of the guess.
#
# Reads only. Sends a poll byte only if the line stays silent, and only the two
# bytes DIGI scales normally answer to. Nothing is written to the scale's memory.
#
# RUN THIS WHEN THE SHOP IS QUIET. Opening the port can take it away from the
# till software for as long as this script runs.

param(
  [string]$Port,           # e.g. COM1. Omitted = try every port Windows lists.
  [int]$ListenSeconds = 4  # how long to listen on each setting
)

$ErrorActionPreference = 'Continue'

# The settings DIGI bench scales are normally shipped on, likeliest first.
$combos = @(
  @{ baud = 9600; bits = 7; parity = 'Even'; }
  @{ baud = 2400; bits = 7; parity = 'Even'; }
  @{ baud = 9600; bits = 8; parity = 'None'; }
  @{ baud = 4800; bits = 7; parity = 'Even'; }
  @{ baud = 1200; bits = 7; parity = 'Even'; }
  @{ baud = 2400; bits = 8; parity = 'None'; }
)

function Show-Bytes([byte[]]$bytes) {
  $hex = ($bytes | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
  # Control codes matter here - STX/ETX/CR/LF are how the frame is delimited.
  $txt = -join ($bytes | ForEach-Object {
    if ($_ -ge 32 -and $_ -le 126) { [char]$_ } else { '.' }
  })
  Write-Host "      hex : $hex" -ForegroundColor Gray
  Write-Host "      txt : $txt" -ForegroundColor White
}

function Try-Port([string]$p) {
  Write-Host ""
  Write-Host "=== $p ===" -ForegroundColor Cyan

  foreach ($c in $combos) {
    $label = "$($c.baud) $($c.bits)$($c.parity.Substring(0,1))1"
    Write-Host "  $label ... " -NoNewline

    $sp = New-Object System.IO.Ports.SerialPort(
      $p, $c.baud, [System.IO.Ports.Parity]::$($c.parity), $c.bits,
      [System.IO.Ports.StopBits]::One)
    $sp.ReadTimeout = 400
    $sp.Handshake = [System.IO.Ports.Handshake]::None
    # Some scales will not transmit until they see these lines raised.
    $sp.DtrEnable = $true
    $sp.RtsEnable = $true

    try { $sp.Open() }
    catch {
      Write-Host "cannot open - $($_.Exception.Message)" -ForegroundColor Red
      if ($_.Exception.Message -match 'denied|in use') {
        Write-Host "      ^ another program holds this port. Hanka, most likely." -ForegroundColor Yellow
        return $true   # port exists but is taken - stop, that is the answer
      }
      continue
    }

    $buf = New-Object byte[] 4096
    $got = New-Object System.Collections.Generic.List[byte]
    $deadline = (Get-Date).AddSeconds($ListenSeconds)
    $polled = $false

    while ((Get-Date) -lt $deadline) {
      if ($sp.BytesToRead -gt 0) {
        $n = $sp.Read($buf, 0, [Math]::Min($sp.BytesToRead, $buf.Length))
        for ($i = 0; $i -lt $n; $i++) { $got.Add($buf[$i]) }
      }
      elseif (-not $polled -and (Get-Date) -gt $deadline.AddSeconds(-2)) {
        # Silent so far. Most DIGI scales answer ENQ or 'W' with one frame.
        $polled = $true
        try {
          $sp.Write([byte[]](0x05), 0, 1)
          Start-Sleep -Milliseconds 300
          $sp.Write([byte[]](0x57, 0x0D), 0, 2)
        } catch { }
      }
      Start-Sleep -Milliseconds 50
    }

    $sp.Close(); $sp.Dispose()

    if ($got.Count -gt 0) {
      Write-Host "$($got.Count) bytes" -ForegroundColor Green
      Show-Bytes $got.ToArray()
      Write-Host "      ^ THIS ONE. Send me these two lines." -ForegroundColor Green
      return $true
    }
    Write-Host "silent" -ForegroundColor DarkGray
  }
  return $false
}

Write-Host ""
Write-Host "  DIGI DS-782 serial sniffer" -ForegroundColor Cyan
Write-Host "  --------------------------"
Write-Host "  Put something on the scale and leave it there while this runs."
Write-Host ""

$ports = if ($Port) { @($Port) } else { [System.IO.Ports.SerialPort]::GetPortNames() }

if (-not $ports -or $ports.Count -eq 0) {
  Write-Host "  No COM ports at all. Windows cannot see a serial port on this PC." -ForegroundColor Red
  Write-Host "  The scale cable may go somewhere else, or the USB-serial adapter"
  Write-Host "  has no driver. Check Device Manager -> Ports (COM & LPT)."
  Write-Host ""
  return
}

Write-Host "  Ports Windows can see: $($ports -join ', ')" -ForegroundColor Green
foreach ($p in $ports) { if (Try-Port $p) { break } }

Write-Host ""
Write-Host "  Done. Copy everything above and send it over." -ForegroundColor Cyan
Write-Host ""
