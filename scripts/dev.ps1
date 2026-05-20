$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Test-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $name"
    }
}

Test-Command python
Test-Command npm

$venvPath = Join-Path $Root "backend\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating Python virtual environment..."
    python -m venv $venvPath
}

$python = Join-Path $venvPath "Scripts\python.exe"
$pip = Join-Path $venvPath "Scripts\pip.exe"

Write-Host "Installing backend dependencies..."
& $pip install -q -r (Join-Path $Root "backend\requirements.txt")

if (-not (Test-Path (Join-Path $Root "frontend\node_modules"))) {
    Write-Host "Installing frontend dependencies..."
    Push-Location (Join-Path $Root "frontend")
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "Starting Leasing Operations Dashboard..."
Write-Host "  API:       http://127.0.0.1:8000"
Write-Host "  Frontend:  http://127.0.0.1:5173  (also http://localhost:5173)"
Write-Host "  Press Ctrl+C to stop both."
Write-Host ""

$backendJob = Start-Job -ScriptBlock {
    param($py, $root)
    Set-Location (Join-Path $root "backend")
    & $py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} -ArgumentList $python, $Root

Push-Location (Join-Path $Root "frontend")
try {
    npm run dev
}
finally {
    Pop-Location
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
}
