import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    """
    Run the FastAPI application using uvicorn.
    """
    # Get host and port from environment variables or use defaults
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    # Run the application
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True  # Enable auto-reload during development
    )


if __name__ == "__main__":
    main()
