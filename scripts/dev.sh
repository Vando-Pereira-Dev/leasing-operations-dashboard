#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/backend/.venv"

command -v python3 >/dev/null || command -v python >/dev/null
command -v npm >/dev/null

PYTHON="$(command -v python3 2>/dev/null || command -v python)"

if [ ! -d "$VENV" ]; then
  echo "Creating Python virtual environment..."
  "$PYTHON" -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install -q -r "$ROOT/backend/requirements.txt"

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT/frontend" && npm install)
fi

echo ""
echo "Starting Leasing Operations Dashboard..."
echo "  API:       http://127.0.0.1:8000"
echo "  Frontend:  http://127.0.0.1:5173"
echo ""

trap 'kill 0' EXIT
(cd "$ROOT/backend" && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
(cd "$ROOT/frontend" && npm run dev) &
wait
