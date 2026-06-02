# MedSpa KPI Dashboard

GoHighLevel integrated KPI dashboard for MedSpa businesses.

## Structure
- `backend/` - FastAPI + GHL integration
- `frontend/` - Next.js dashboard

## Quick Start
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install recharts
npm run dev
