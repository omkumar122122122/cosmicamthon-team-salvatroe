@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py -3.11 -m venv .venv
) else (
    python -m venv .venv
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
)

echo.
echo Setup complete.
echo Activate the environment with: .venv\Scripts\activate.bat
echo Start the AI service with: uvicorn main:app --reload --host 0.0.0.0 --port 8001
endlocal
