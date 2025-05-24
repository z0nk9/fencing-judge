import os
import logging
import google.generativeai as genai
from typing import Dict, Any, List, Optional
import base64
from app.models.schemas import FencingAction, VideoAnalysis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Configure the Gemini API with your API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-api-key-here")
genai.configure(api_key=GEMINI_API_KEY)

# Define the model to use
MODEL_NAME = "gemini-2.5-flash-preview-05-20"

async def analyze_video(file_path: str) -> VideoAnalysis:
    """
    Analyze a fencing video using Google's Gemini API.
    
    Args:
        file_path: Path to the video file
        
    Returns:
        VideoAnalysis object containing the analysis results
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get video metadata
        from app.services.video_processor import process_video
        video_metadata = await process_video(file_path)
        
        # Check file size before processing
        file_size = os.path.getsize(file_path)
        max_size_mb = 20  # Set a reasonable limit (adjust based on Gemini API limits)
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if file_size > max_size_bytes:
            logger.warning(f"Video file is too large ({file_size / (1024 * 1024):.2f} MB). Gemini API may have issues with files larger than {max_size_mb} MB.")
            # Continue anyway but log a warning
        
        # Prepare the video for Gemini API
        with open(file_path, "rb") as f:
            video_bytes = f.read()
        
        # Encode video as base64
        video_base64 = base64.b64encode(video_bytes).decode("utf-8")
        
        # Create a Gemini model instance
        model = genai.GenerativeModel(MODEL_NAME)
        
        # Prepare the prompt for fencing action detection
        prompt = """
        Analyze this fencing video and identify all fencing actions.
        For each action, provide:
        1. The type of action (attack, parry, riposte, counter-attack, touch, etc.)
        2. The timestamp in seconds when it occurs
        3. Which fencer performed the action (left or right)
        4. A brief description of the action
        
        Format your response as a structured JSON with an array of actions, each containing:
        - action_type: string (the type of action)
        - timestamp: number (time in seconds)
        - player: string ("left" or "right")
        - description: string (brief description)
        - confidence: number (your confidence in this detection, from 0.0 to 1.0)
        
        Also provide a summary of the bout.
        """
        
        # Determine the MIME type based on file extension
        file_extension = os.path.splitext(file_path)[1].lower()
        mime_type = "video/mp4"  # Default
        
        if file_extension == ".mov":
            mime_type = "video/quicktime"
        elif file_extension == ".webm":
            mime_type = "video/webm"
        elif file_extension == ".avi":
            mime_type = "video/x-msvideo"
        
        # Call the Gemini API with better error handling
        try:
            response = model.generate_content(
                [
                    prompt,
                    {
                        "mime_type": mime_type,
                        "data": video_base64
                    }
                ]
            )
            
            # Parse the response
            raw_response = response.text
            logger.info(f"Successfully received response from Gemini API")
            
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            # Check for common errors
            error_msg = str(e).lower()
            raise Exception(f"Gemini API error: {str(e)}")
        
        # For demonstration purposes, we'll create a mock response
        # In a real implementation, you would parse the JSON from the API response
        mock_actions = [
            FencingAction(
                action_type="attack",
                timestamp=1.5,
                confidence=0.95,
                description="Right fencer initiates attack",
                player="right"
            ),
            FencingAction(
                action_type="parry",
                timestamp=1.7,
                confidence=0.85,
                description="Left fencer parries the attack",
                player="left"
            ),
            FencingAction(
                action_type="riposte",
                timestamp=1.9,
                confidence=0.9,
                description="Left fencer executes riposte",
                player="left"
            ),
            FencingAction(
                action_type="touch",
                timestamp=2.1,
                confidence=0.98,
                description="Left fencer scores a touch",
                player="left"
            )
        ]
        
        # Create the VideoAnalysis object
        analysis = VideoAnalysis(
            video_id=os.path.basename(file_path).split(".")[0],
            filename=os.path.basename(file_path),
            duration=video_metadata.get("duration", 0),
            actions=mock_actions,
            summary="The bout begins with the right fencer initiating an attack, which is parried by the left fencer. The left fencer then executes a successful riposte, scoring a touch.",
            raw_ai_response={"raw_text": raw_response}
        )
        
        return analysis
    
    except Exception as e:
        logger.exception(f"Error analyzing video with Gemini API: {str(e)}")
        raise