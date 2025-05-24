import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: (player: Player) => void;
  onError?: (error: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onTimeUpdate,
  onReady,
  onError
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  // Determine video type based on file extension
  const getVideoType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      default:
        return 'video/mp4'; // Default fallback
    }
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be instantiated
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current?.appendChild(videoElement);
      playerRef.current = videojs(videoElement, {
        controls: true,
        fluid: true,
        responsive: true,
        aspectRatio: '16:9',
        preload: 'auto',
        poster: poster,
        sources: [{
          src: src,
          type: getVideoType(src)
        }]
      }, () => {
        // Player is ready
        if (onReady) {
          onReady(playerRef.current as Player);
        }
      });

      // Add time update event listener
      if (onTimeUpdate) {
        playerRef.current.on('timeupdate', () => {
          onTimeUpdate(playerRef.current?.currentTime() || 0);
        });
      }
      
      // Add error event listener
      playerRef.current.on('error', () => {
        const error = playerRef.current?.error();
        const errorMessage = error ?
          `Video error: ${error.message}` :
          'The media could not be loaded, either because the server or network failed or because the format is not supported.';
        
        console.error(errorMessage, error);
        if (onError) {
          onError(errorMessage);
        }
      });
    } else {
      // Update the player source if src changes
      playerRef.current.src([{
        src: src,
        type: getVideoType(src)
      }]);
      
      if (poster) {
        playerRef.current.poster(poster);
      }
    }
  }, [src, poster, onTimeUpdate, onReady]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full">
      <div ref={videoRef} className="w-full aspect-video" />
    </div>
  );
};

export default VideoPlayer;