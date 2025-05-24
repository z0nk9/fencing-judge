from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class FencingAction(BaseModel):
    """
    Represents a fencing action detected in the video.
    """
    action_type: str  # e.g., "attack", "parry", "touch"
    timestamp: float  # Time in seconds from the start of the video
    confidence: float  # Confidence score from the AI model
    description: Optional[str] = None
    player: Optional[str] = None  # e.g., "left", "right"

class VideoAnalysis(BaseModel):
    """
    Represents the complete analysis of a fencing video.
    """
    video_id: str
    filename: str
    duration: float  # Video duration in seconds
    actions: List[FencingAction]
    summary: Optional[str] = None
    created_at: datetime = datetime.now()
    raw_ai_response: Optional[Dict[str, Any]] = None

class VideoUploadResponse(BaseModel):
    """
    Response model for video upload endpoint.
    """
    filename: str
    status: str

class VideoListResponse(BaseModel):
    """
    Response model for listing videos endpoint.
    """
    videos: List[str]

class AnalysisResponse(BaseModel):
    """
    Response model for video analysis endpoint.
    """
    filename: str
    analysis: VideoAnalysis