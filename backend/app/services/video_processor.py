import os
import cv2
import logging
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Get directories from environment variables or use defaults
THUMBNAILS_DIR = os.getenv("THUMBNAILS_DIR", "thumbnails")
FRAMES_DIR = os.getenv("FRAMES_DIR", "frames")

async def process_video(file_path: str) -> Dict[str, Any]:
    """
    Process a video file to extract basic metadata.
    
    Args:
        file_path: Path to the video file
        
    Returns:
        Dictionary containing video metadata
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return {"error": "File not found"}
        
        # Open the video file
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            logger.error(f"Could not open video file: {file_path}")
            return {"error": "Could not open video file"}
        
        # Extract basic metadata
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Calculate duration in seconds
        duration = frame_count / fps if fps > 0 else 0
        
        # Extract thumbnail (first frame)
        thumbnail_path = generate_thumbnail(file_path, cap)
        
        # Release the video capture object
        cap.release()
        
        return {
            "filename": os.path.basename(file_path),
            "fps": fps,
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration": duration,
            "thumbnail": thumbnail_path
        }
    
    except Exception as e:
        logger.exception(f"Error processing video: {str(e)}")
        return {"error": f"Error processing video: {str(e)}"}

def generate_thumbnail(file_path: str, cap: cv2.VideoCapture = None) -> str:
    """
    Generate a thumbnail from the video.
    
    Args:
        file_path: Path to the video file
        cap: Optional VideoCapture object (to avoid reopening the file)
        
    Returns:
        Path to the generated thumbnail
    """
    try:
        # Create thumbnails directory if it doesn't exist
        thumbnails_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(file_path))), THUMBNAILS_DIR)
        os.makedirs(thumbnails_dir, exist_ok=True)
        
        # Generate thumbnail filename
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        thumbnail_path = os.path.join(thumbnails_dir, f"{base_name}_thumb.jpg")
        
        # Open video if not provided
        should_release = False
        if cap is None:
            cap = cv2.VideoCapture(file_path)
            should_release = True
        
        # Read the first frame
        ret, frame = cap.read()
        if not ret:
            logger.error(f"Could not read frame from video: {file_path}")
            return ""
        
        # Save the frame as a thumbnail
        cv2.imwrite(thumbnail_path, frame)
        
        # Release the capture if we opened it
        if should_release:
            cap.release()
        
        return thumbnail_path
    
    except Exception as e:
        logger.exception(f"Error generating thumbnail: {str(e)}")
        return ""

async def extract_frames(file_path: str, timestamps: list) -> Dict[float, str]:
    """
    Extract frames at specific timestamps.
    
    Args:
        file_path: Path to the video file
        timestamps: List of timestamps (in seconds) to extract frames
        
    Returns:
        Dictionary mapping timestamps to frame file paths
    """
    try:
        # Create frames directory if it doesn't exist
        frames_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(file_path))), FRAMES_DIR)
        os.makedirs(frames_dir, exist_ok=True)
        
        # Open the video file
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            logger.error(f"Could not open video file: {file_path}")
            return {}
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Extract frames at each timestamp
        result = {}
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        
        for timestamp in timestamps:
            # Convert timestamp to frame number
            frame_number = int(timestamp * fps)
            
            # Skip if frame number is out of range
            if frame_number >= frame_count:
                logger.warning(f"Frame number {frame_number} is out of range for video with {frame_count} frames")
                continue
            
            # Set the video position to the desired frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            
            # Read the frame
            ret, frame = cap.read()
            if not ret:
                logger.error(f"Could not read frame {frame_number} from video: {file_path}")
                continue
            
            # Save the frame
            frame_path = os.path.join(frames_dir, f"{base_name}_frame_{frame_number}.jpg")
            cv2.imwrite(frame_path, frame)
            
            # Add to result
            result[timestamp] = frame_path
        
        # Release the video capture object
        cap.release()
        
        return result
    
    except Exception as e:
        logger.exception(f"Error extracting frames: {str(e)}")
        return {}