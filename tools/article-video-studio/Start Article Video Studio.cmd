@echo off
cd /d "%~dp0"
python app.py
if errorlevel 1 (
  echo.
  echo The studio could not start. Keep this window open and share the error above.
  pause
)
