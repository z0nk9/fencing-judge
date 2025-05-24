# app package initialization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.routes import router

# Create FastAPI app
app = FastAPI(
    title="Fencing Judge API",
    description="API for analyzing fencing videos",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get upload directory from environment variable or use default
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Include API routes
app.include_router(router, prefix="/api")

# Mount static file directory for serving uploaded videos
app.mount("/api/videos", StaticFiles(directory=UPLOAD_DIR), name="videos")