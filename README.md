# AI Attendance Microservice Migration Guide

This repository contains two Python-driven services:
- the AI vision microservice in ai_microservice/main.py
- the FastAPI chatbot backend in backend/app/main.py

## 1. Requirements

The pinned Python dependencies are stored in requirements.txt and backend/requirements.txt.

## 2. Windows setup

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## 3. External software

Install these separately on the new Windows machine:
- Python 3.11 x64
- Git
- PostgreSQL 14+ (or a reachable PostgreSQL instance)
- Node.js 18+ for the frontend/NestJS backend
- Visual Studio Build Tools 2022 if wheel builds are needed
- Microsoft Visual C++ Redistributable

## 4. Environment variables

Copy backend/.env.example to backend/.env and adjust the values.

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/child_safety_db?schema=public
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
DEBUG=false
HOST=0.0.0.0
PORT=8000
MODEL_NAME=buffalo_l
INSIGHTFACE_MODEL_DIR=%USERPROFILE%\.insightface\models
```

## 5. AI models

The service uses InsightFace with the buffalo_l model. On first run, InsightFace will download the model into:

```text
C:\Users\<username>\.insightface\models\buffalo_l
```

To move the installation to another PC, copy that directory to the same location on the new machine.

## 6. Verification

```powershell
python --version
python -c "import fastapi"
python -c "import cv2"
python -c "import insightface"
python -c "import onnxruntime"
python -c "import asyncpg"
```

## 7. Start the services

AI microservice:

```powershell
uvicorn ai_microservice.main:app --reload --host 0.0.0.0 --port 8001
```

Backend chat service:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 8. Troubleshooting

- ModuleNotFoundError: run pip install -r requirements.txt again
- OpenCV error on Windows: install Microsoft Visual C++ Redistributable
- InsightFace model download failure: copy the model folder manually or retry with internet access
- Database connection failed: verify DATABASE_URL and PostgreSQL availability
- Missing .env: copy backend/.env.example to backend/.env
