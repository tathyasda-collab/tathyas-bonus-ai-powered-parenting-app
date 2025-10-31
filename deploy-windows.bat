@echo off
echo ============================================
echo Tathyas AI Parenting App - Windows Setup
echo ============================================
echo.

REM Check if Git Bash is installed
where bash >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git Bash not found!
    echo Please install Git for Windows first:
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI not found!
    echo Please install AWS CLI first:
    echo https://aws.amazon.com/cli/
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js first:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo All prerequisites found!
echo.
echo This will deploy your AI Parenting App to: bonusaiapp.tathyas.in
echo.
echo IMPORTANT: Make sure you have:
echo 1. AWS credentials configured (run 'aws configure' if not)
echo 2. Access to modify DNS for tathyas.in domain
echo.
set /p choice="Continue with deployment? (Y/N): "
if /i "%choice%" NEQ "Y" goto :end

echo.
echo Starting deployment...
echo.

REM Run the setup script using Git Bash
bash deployment/setup-aws.sh

echo.
echo Deployment script completed!
echo.
echo Next steps:
echo 1. Check if bonusaiapp.tathyas.in is working
echo 2. Add link to your main tathyas.in website
echo 3. Test the application thoroughly
echo.

:end
pause