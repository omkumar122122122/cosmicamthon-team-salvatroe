# YourSathi AI Backend — FastAPI + Gemini (RAG-Ready)

## Quick Start

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Add your Gemini API key to .env
# Edit .env → replace 'your_gemini_api_key_here'
# Free key: https://aistudio.google.com/app/apikey

# Start server
uvicorn app.main:app --reload --port 8000
```

Server runs at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## Architecture — RAG-Ready Pipeline

```
POST /api/chat
       │
       ▼
routes/chat.py           — validates request, calls gemini_service
       │
       ▼
services/gemini_service.py
  ├── Step 1: retrieve_all_context()   ← RETRIEVAL LAYER
  │          ├── parent_repository     (parent profile, KYC)
  │          ├── child_repository      (child profile)
  │          ├── health_repository     (health reports)
  │          ├── vaccination_repository(schedule + overdue)
  │          └── appointment_repository(upcoming visits)
  │
  ├── Step 2: context_builder.py       ← FORMAT LAYER
  │          └── Converts data → Markdown context block
  │
  └── Step 3: Gemini API call          ← GENERATION LAYER
             └── system_prompt + context + conversation → reply
```

---

## API Reference

### POST /api/chat

**Request:**
```json
{
  "message": "What is my child's vaccination status?",
  "conversation": [],
  "parentId": "PAR-2026-0148",
  "childId": "CH-1034"
}
```

**Response:**
```json
{
  "reply": "Based on the records for **Anaya Das** (CH-1034)..."
}
```

---

## Connecting a Real Database

Each repository in `app/repositories/` has a single async function.
Replace the placeholder body with your real query:

```python
# child_repository.py — current placeholder
async def get_child_by_id(child_id: str) -> Optional[dict]:
    return _demo.get(child_id)          # ← replace this

# MongoDB example
async def get_child_by_id(child_id: str) -> Optional[dict]:
    doc = await db.children.find_one({"id": child_id})
    return doc

# PostgreSQL (asyncpg) example
async def get_child_by_id(child_id: str) -> Optional[dict]:
    row = await db.fetchrow("SELECT * FROM children WHERE id = $1", child_id)
    return dict(row) if row else None
```

**No other file needs to change.**

---

## Adding Vector Search (RAG with ChromaDB / FAISS / Pinecone)

In `retrieval_service.py`, add after the repository fetches:

```python
# 1. Embed the user message
vector = await embeddings.embed(user_message)

# 2. Query your vector store
docs = await vector_store.similarity_search(vector, top_k=5)

# 3. Add to context
ctx.vector_chunks = [doc.page_content for doc in docs]
```

Then in `context_builder.py`, render the chunks:

```python
if ctx.vector_chunks:
    sections.append("\n### Relevant Policy Documents")
    for chunk in ctx.vector_chunks:
        sections.append(f"> {chunk[:300]}...")
```
