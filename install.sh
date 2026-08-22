#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi

echo "Setup complete."
echo "Activate with: source .venv/bin/activate"
echo "Start the AI service with: uvicorn main:app --reload --host 0.0.0.0 --port 8001"
