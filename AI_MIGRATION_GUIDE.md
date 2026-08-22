# AI Attendance Microservice Migration Guide

This guide covers moving the AI-powered attendance service and its Python dependencies to a fresh Windows machine.

## 1. What this project contains

- AI vision microservice: [ai_microservice/main.py](ai_microservice/main.py)
- FastAPI chat backend: [backend/app/main.py](backend/app/main.py)
- PostgreSQL-backed chat service: [backend/app/database.py](backend/app/database.py)
- Gemini AI integration: [backend/app/services/gemini_service.py](backend/app/services/gemini_service.py)

## 2. Python requirements

Install Python 3.11 x64 from python.org.

Create and activate a virtual environment:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## 3. Required external software

- Python 3.11 x64
- Git
- PostgreSQL 14+ (or a reachable PostgreSQL instance)
- Node.js 18+ for the frontend and NestJS backend
- Visual Studio Build Tools 2022 if wheel compilation is needed on Windows
- Microsoft Visual C++ Redistributable (often needed for OpenCV/InsightFace runtime packages)

## 4. Environment variables

Copy [backend/.env.example](backend/.env.example) to [backend/.env](backend/.env) and adjust values.

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/child_safety_db?schema=public
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
DEBUG=false
HOST=0.0.0.0
PORT=8000
```

## 5. AI models

The service uses InsightFace with the `buffalo_l` model.

On first run, InsightFace downloads the model files to:

```text
C:\Users\<username>\.insightface\models\buffalo_l
```

To move the model to another PC, copy the entire directory:

```text
C:\Users\<username>\.insightface\models\buffalo_l
```

into the same location on the new machine, or set the model directory explicitly using the environment variable `INSIGHTFACE_MODEL_DIR`.

## 6. Folder structure

```text
.
├── ai_microservice/
│   └── main.py
├── backend/
│   ├── app/
│   ├── prisma/
│   └── requirements.txt
├── requirements.txt
├── setup.ps1
├── setup.bat
├── install.sh
├── .env.example
└── AI_MIGRATION_GUIDE.md
```

## 7. Verification commands

```powershell
python --version
pip list
python -c "import fastapi"
python -c "import cv2"
python -c "import insightface"
python -c "import onnxruntime"
python -c "import asyncpg"
```

## 8. Startup commands

Start the AI service from the project root:

```powershell
uvicorn ai_microservice.main:app --reload --host 0.0.0.0 --port 8001
```

Start the chat backend:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 9. Troubleshooting

- ModuleNotFoundError: reinstall with `pip install -r requirements.txt`
- OpenCV DLL issues: install the Microsoft Visual C++ Redistributable
- InsightFace download failure: ensure internet access and retry, or copy the model directory manually
- Database connection failed: verify `DATABASE_URL` and ensure PostgreSQL is reachable
- Missing `.env`: copy [.env.example](.env.example) to [backend/.env](backend/.env)
- GPU provider warnings: CPU mode still works; install CUDA/cuDNN only if you need GPU acceleration
