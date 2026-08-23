# Velora — AI Safety Intelligence & Welfare Monitoring

## 1. Vision Microservice Architecture
Velora runs a standalone Python FastAPI service on port 8000 powered by **InsightFace (`buffalo_l`)**:
- **Face Detection**: SCRFD 10G deep face detection with sub-millisecond bounding box localization.
- **Biometric Feature Extraction**: ArcFace deep convolutional network extracting 512-dimensional normalized embedding vectors.
- **Identity Verification**: Cosine similarity computation between presented frame and enrolled baseline.

---

## 2. Decision Support Principles (No Autonomous Accusations)
- **Probabilistic Observations**: AI outputs objective signals (e.g. `Engagement: High`, `Face Match: 98.4%`, `Vocal Tone: Calm`).
- **Zero Autonomous Revocations**: AI never revokes adoptions, denies custody, or creates automated criminal abuse verdicts.
- **Mandatory Human Caseworker Oversight**: Authorized caseworkers make all case determinations with immutable logging.

---

## 3. Biometric Security & Privacy
- **Zero Client Vector Exposure**: 512D embedding vectors are strictly stored server-side and never returned in API payloads or HTML responses.
- **Automatic Camera Track Release**: All WebRTC MediaStream tracks are terminated upon component unmount.
