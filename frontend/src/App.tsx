import { useState, useEffect, useRef } from 'react';
import './App.css';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import { uploadVideo, analyzeVideo, listVideos } from './services/api';
import type { FencingAction, VideoAnalysis } from './services/api';
import type Player from 'video.js/dist/types/player';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [videoList, setVideoList] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<Player | null>(null);

  // Load video list on component mount
  useEffect(() => {
    fetchVideoList();
  }, []);

  // Fetch list of uploaded videos
  const fetchVideoList = async () => {
    try {
      const response = await listVideos();
      setVideoList(response.videos);
    } catch (error) {
      console.error('Error fetching video list:', error);
      setError('Failed to fetch video list');
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadVideo(selectedFile);
      setUploadedFilename(response.filename);
      setCurrentVideo(response.filename);
      
      // Refresh video list
      await fetchVideoList();
      
      // Reset file input
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle video analysis
  const handleAnalyze = async () => {
    if (!currentVideo) {
      setError('No video selected for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await analyzeVideo(currentVideo);
      setAnalysis(response.analysis);
    } catch (error) {
      console.error('Error analyzing video:', error);
      setError('Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle video selection from list
  const handleVideoSelect = (filename: string) => {
    setCurrentVideo(filename);
    setAnalysis(null); // Reset analysis when changing videos
  };

  // Handle seeking in the video
  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  };

  // Handle player ready event
  const handlePlayerReady = (player: Player) => {
    playerRef.current = player;
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-7xl mx-auto p-4">
      <header className="py-4 border-b border-base-300 mb-8">
        <h1 className="text-center text-2xl text-primary">Fencing Video Judge</h1>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-4 p-4 bg-base-200 rounded-lg mb-4">
          <h2 className="text-xl font-semibold">Upload Video</h2>
          <div className="flex gap-4 mt-4">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="file-input file-input-bordered flex-1"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="btn btn-primary"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          {currentVideo ? (
            <>
              <div className="w-full rounded-lg overflow-hidden shadow-md">
                <VideoPlayer
                  src={`http://localhost:8000/api/videos/${currentVideo}`}
                  onTimeUpdate={setCurrentTime}
                  onReady={handlePlayerReady}
                  onError={(errorMessage) => setError(errorMessage)}
                />
                
                {analysis && (
                  <Timeline
                    duration={analysis.duration}
                    currentTime={currentTime}
                    actions={analysis.actions}
                    onSeek={handleSeek}
                  />
                )}
              </div>

              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Video Analysis</h2>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="btn btn-success"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
                  </button>
                </div>

                {analysis && (
                  <div>
                    <h3 className="text-lg font-medium mt-6 mb-2 text-neutral-800">Summary</h3>
                    <p>{analysis.summary || 'No summary available'}</p>
                    
                    <h3 className="text-lg font-medium mt-6 mb-2 text-neutral-800">Detected Actions</h3>
                    {analysis.actions.length > 0 ? (
                      <ul className="divide-y divide-base-300">
                        {analysis.actions.map((action, index) => (
                          <li
                            key={index}
                            className="grid grid-cols-4 gap-2 py-3 px-3 hover:bg-base-300 cursor-pointer transition-colors"
                            onClick={() => handleSeek(action.timestamp)}
                          >
                            <span className="font-mono text-neutral-500">{formatTime(action.timestamp)}</span>
                            <span className="font-bold capitalize">{action.action_type}</span>
                            <span className="text-neutral-600 capitalize">{action.player}</span>
                            <span>{action.description}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No actions detected</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-[300px] bg-base-200 rounded-lg text-neutral-500">
              <p>Upload a video or select one from the list to begin</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 bg-base-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold">Uploaded Videos</h2>
          {videoList.length > 0 ? (
            <ul className="mt-2">
              {videoList.map((filename, index) => (
                <li
                  key={index}
                  className={`py-3 px-3 border-b border-base-300 cursor-pointer transition-colors truncate
                    ${currentVideo === filename ? 'bg-primary/10 font-bold' : 'hover:bg-base-300'}`}
                  onClick={() => handleVideoSelect(filename)}
                >
                  {filename}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">No videos uploaded yet</p>
          )}
        </div>
      </main>

      {error && (
        <div className="mt-4 p-3 bg-error/10 text-error rounded-md text-center">
          {error}
        </div>
      )}
    </div>
  );
}

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default App;
