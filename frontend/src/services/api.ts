import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface FencingAction {
  action_type: string;
  timestamp: number;
  confidence: number;
  description?: string;
  player?: string;
}

export interface VideoAnalysis {
  video_id: string;
  filename: string;
  duration: number;
  actions: FencingAction[];
  summary?: string;
  created_at: string;
}

// API functions
export const uploadVideo = async (file: File): Promise<{ filename: string; status: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const analyzeVideo = async (filename: string): Promise<{ filename: string; analysis: VideoAnalysis }> => {
  const response = await apiClient.get(`/analyze/${filename}`);
  return response.data;
};

export const listVideos = async (): Promise<{ videos: string[] }> => {
  const response = await apiClient.get('/videos');
  return response.data;
};

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.detail || 'An error occurred';
    console.error('API Error:', errorMessage);
    return Promise.reject(error);
  }
);

export default {
  uploadVideo,
  analyzeVideo,
  listVideos,
};