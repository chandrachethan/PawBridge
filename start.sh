#!/usr/bin/env bash
cd "$(dirname "$0")/backend" || exit 1
[ -d venv ] || python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo
echo "PawBridge is starting. Open  http://localhost:8000  in your browser."
uvicorn main:app --reload
