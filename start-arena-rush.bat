@echo off
setlocal
title Arena Rush launcher
cd /d "%~dp0"

echo ==========================================
echo   Arena Rush - TikTok LIVE game launcher
echo ==========================================
echo.

rem ---- 1. Check for Node.js ----
where node >nul 2>nul
if %errorlevel%==0 goto havenode
if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
  goto havenode
)

echo Node.js is not installed. Installing the latest LTS version...
echo (Windows may ask for permission - click Yes.)
echo.
where winget >nul 2>nul
if %errorlevel%==0 (
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
) else (
  echo winget not found, downloading the installer from nodejs.org...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop';" ^
    "$v=(Invoke-RestMethod 'https://nodejs.org/dist/index.json' | Where-Object { $_.lts } | Select-Object -First 1).version;" ^
    "$f=Join-Path $env:TEMP ('node-'+$v+'-x64.msi');" ^
    "Write-Host ('Downloading Node.js '+$v+' ...');" ^
    "Invoke-WebRequest ('https://nodejs.org/dist/'+$v+'/node-'+$v+'-x64.msi') -OutFile $f;" ^
    "Start-Process msiexec.exe -ArgumentList '/i',$f,'/passive' -Wait"
)
set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if not %errorlevel%==0 (
  echo.
  echo Node.js could not be installed automatically.
  echo Please install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

:havenode
for /f "delims=" %%v in ('node -v') do echo Node.js %%v found.
echo.

rem ---- 2. Install the bridge packages (first time only) ----
if not exist "tiktok-server\server.js" (
  echo Could not find tiktok-server\server.js next to this file.
  echo Keep this .bat file inside the arena-rush folder.
  pause
  exit /b 1
)
if not exist "tiktok-server\node_modules" (
  echo Installing game packages, this happens only once...
  pushd tiktok-server
  call npm.cmd install
  popd
  echo.
)

rem ---- 3. Start the bridge in its own window ----
echo Starting the game server...
start "Arena Rush Bridge - keep this window open" /D "%~dp0tiktok-server" cmd /k node server.js

rem ---- 4. Open the game in the browser ----
timeout /t 3 /nobreak >nul
start "" "http://localhost:8787/"

echo.
echo The game is open in your browser.
echo Type your TikTok username in the admin panel and press Connect.
echo Keep the "Arena Rush Bridge" window open while you stream.
echo.
timeout /t 8 >nul
endlocal
