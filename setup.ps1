$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
    & py -3.11 --version | Out-Null
}
elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
    & python --version | Out-Null
}
else {
    throw "Python 3.11+ was not found on PATH. Install Python 3.11 first."
}

if (-not (Test-Path ".venv")) {
    if ($pythonCmd -eq "py") {
        & py -3.11 -m venv .venv
    }
    else {
        & python -m venv .venv
    }
}

. ".\.venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

if (-not (Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
}

Write-Host ""
Write-Host "Setup complete."
Write-Host "Activate the environment with: .\.venv\Scripts\Activate.ps1"
Write-Host "Start the AI service with: uvicorn main:app --reload --host 0.0.0.0 --port 8001"
