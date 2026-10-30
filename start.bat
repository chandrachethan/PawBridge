@echo off
setlocal
cd /d "%~dp0backend"

REM Use Python 3.12 for a stable local environment matching the Docker image.
set "PYTHON_CMD="
where py >nul 2>&1
if not errorlevel 1 (
  py -3.12 --version >nul 2>&1
  if not errorlevel 1 set "PYTHON_CMD=py -3.12"
)

if not defined PYTHON_CMD (
  echo Python 3.12 was not found.
  echo Install Python 3.12 from https://www.python.org/downloads/release/python-31210/
  echo During installation, enable "Add python.exe to PATH".
  echo Then close this window and run start.bat again.
  pause
  exit /b 1
)

REM Recreate an old virtual environment if it was made with another Python version.
if exist venv (
  venv\Scripts\python.exe -c "import sys; raise SystemExit(0 if sys.version_info[:2] == (3,12) else 1)" >nul 2>&1
  if errorlevel 1 (
    echo Recreating virtual environment with Python 3.12...
    rmdir /s /q venv
  )
)

if not exist venv (
  echo Creating Python 3.12 virtual environment...
  %PYTHON_CMD% -m venv venv
  if errorlevel 1 goto install_failed
)

call venv\Scripts\activate.bat
python -m pip install --upgrade pip
if errorlevel 1 goto install_failed
python -m pip install -r requirements.txt
if errorlevel 1 goto install_failed

echo.
echo PawBridge is starting. Open http://localhost:8000 in your browser.
echo Press Ctrl+C in this window to stop.
python -m uvicorn main:app --reload
goto end

:install_failed
echo.
echo Dependency installation failed. Please check the error above.

:end
pause
