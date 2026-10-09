"""
Main FastAPI application for CropSafe with Gemini AI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

import os
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()

from database.db import init_db

# Import routes
from api.prediction_routes import router as prediction_router
from api.history_routes import router as history_router
from api.map_routes import router as map_router

# Initialize database schema
init_db()

# Initialize FastAPI
app = FastAPI(
    title="CropSafe API",
    description="AI-Powered Crop Disease Detection System with Farmer Diagnosis History & Outbreak Map",
    version="2.2.0"
)

# Configure CORS - allow all origins by default so live deployed frontends (Vercel, Netlify) can connect
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
allow_all = "*" in origins or not origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=False if allow_all else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(prediction_router)
app.include_router(history_router)
app.include_router(map_router)

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "CropSafe AI API is running",
        "version": "2.1.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "CropSafe AI Backend",
        "ai_model": "Gemini 2.5 Flash",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/test")
async def test():
    return {"message": "API is working", "ai_ready": True}

if __name__ == "__main__":
    print("=" * 50)
    print("CropSafe AI Backend Starting...")
    print("=" * 50)
    print("\nAvailable endpoints:")
    print("  - GET  /")
    print("  - GET  /api/health")
    print("  - GET  /api/test")
    print("  - GET  /api/ai/status")
    print("  - POST /api/predict/wheat")
    print("  - POST /api/predict/rice")
    print("  - POST /api/farmers/login")
    print("  - POST /api/history")
    print("  - GET  /api/history/farmer/{farmer_id}")
    print("  - PATCH /api/history/{history_id}/status")
    print("\nServer starting at http://localhost:8000")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True
    )