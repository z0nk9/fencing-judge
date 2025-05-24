from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import os
import uuid
from typing import List, Optional
from app.services.video_processor import process_video
from app.services.gemini_service import analyze_video
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Get upload directory from environment variable or use default
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload a fencing video for analysis.
    """
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Process the video in the background if requested
    if background_tasks:
        background_tasks.add_task(process_video, file_path)
    
    return {"filename": unique_filename, "status": "uploaded"}

@router.get("/analyze/{filename}")
async def analyze_fencing_video(filename: str):
    """
    Analyze a fencing video using Gemini API.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Analyze the video
    try:
        analysis_results = await analyze_video(file_path)
        return {"filename": filename, "analysis": analysis_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/videos")
async def list_videos():
    """
    List all uploaded videos.
    """
    try:
        videos = [f for f in os.listdir(UPLOAD_DIR) if os.path.isfile(os.path.join(UPLOAD_DIR, f))]
        return {"videos": videos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list videos: {str(e)}")