# AI Trip Planner

This is the repository for the AI Trip Planner application.

## Folder Structure
- `frontend/`: The frontend application (React 19 + Vite + TypeScript + TailwindCSS)
- `backend/`: The backend REST API (Node.js + Express + Prisma + SQLite/PostgreSQL)
- `ai-service/`: The AI itinerary & concierge service (Python + FastAPI + Google Gemini)

## Getting Started

### 1. Backend (Node.js API)
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### 2. AI Service (Python FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

### 3. Frontend (React App)
```bash
cd frontend
npm install
npm run dev
```

### Or using Docker Compose
```bash
docker-compose up --build
```

