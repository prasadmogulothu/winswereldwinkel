@echo off
REM Groenten module - start the local server and open it as an app window.
REM Nothing is installed and nothing goes to the internet.

cd /d "%~dp0"

REM Server in its own hidden window. Closing that window stops the server.
start "Groenten server" /min powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0serve.ps1"

REM Give HttpListener a moment to bind the port before Chrome asks for the page.
timeout /t 2 /nobreak >nul

set CHROME=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe

if defined CHROME (
  start "" "%CHROME%" --app=http://localhost:8777 --window-size=1280,900
) else (
  REM No Chrome - Edge is on every Windows 10/11 machine and handles this fine.
  start "" msedge --app=http://localhost:8777 --window-size=1280,900
)
