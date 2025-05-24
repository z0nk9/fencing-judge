import React, { useEffect, useRef, useState } from 'react';
// No need to import CSS file anymore

interface FencingAction {
  action_type: string;
  timestamp: number;
  confidence: number;
  description?: string;
  player?: string;
}

interface TimelineProps {
  duration: number;
  currentTime: number;
  actions: FencingAction[];
  onSeek: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  actions,
  onSeek
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredAction, setHoveredAction] = useState<FencingAction | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  // Get color based on action type
  const getActionColor = (actionType: string): string => {
    const colorMap: Record<string, string> = {
      'attack': '#ff5252',
      'parry': '#4caf50',
      'riposte': '#2196f3',
      'counter-attack': '#ff9800',
      'touch': '#9c27b0',
      'default': '#757575'
    };
    
    return colorMap[actionType.toLowerCase()] || colorMap.default;
  };

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = clickPosition / rect.width;
      const seekTime = percentage * duration;
      onSeek(seekTime);
    }
  };

  // Handle marker hover
  const handleMarkerHover = (
    action: FencingAction,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    setHoveredAction(action);
    setTooltipPosition({
      left: e.clientX,
      top: e.clientY - 40 // Position tooltip above the cursor
    });
  };

  return (
    <div className="w-full my-5">
      <div
        ref={timelineRef}
        className="relative h-[10px] bg-base-300 rounded-full cursor-pointer overflow-visible"
        onClick={handleTimelineClick}
      >
        {/* Timeline progress bar */}
        <div
          className="absolute h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Action markers */}
        {actions.map((action, index) => (
          <div
            key={index}
            className="absolute w-3 h-3 rounded-full -top-[1px] transform -translate-x-1/2 cursor-pointer z-10 hover:scale-150 hover:z-20 transition-transform"
            style={{
              left: `${(action.timestamp / duration) * 100}%`,
              backgroundColor: getActionColor(action.action_type)
            }}
            onMouseEnter={(e) => handleMarkerHover(action, e)}
            onMouseLeave={() => setHoveredAction(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(action.timestamp);
            }}
          />
        ))}
      </div>
      
      {/* Time display */}
      <div className="flex justify-between mt-1 text-xs text-neutral-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      {/* Tooltip */}
      {hoveredAction && (
        <div
          className="fixed bg-neutral-800/90 text-white p-2 rounded text-xs z-50 pointer-events-none max-w-[250px] transform -translate-x-1/2 -translate-y-full shadow-md"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top
          }}
        >
          <div className="flex justify-between mb-1">
            <span className="font-bold capitalize">{hoveredAction.action_type}</span>
            <span className="text-neutral-400">{formatTime(hoveredAction.timestamp)}</span>
          </div>
          {hoveredAction.description && (
            <div className="mt-1 text-[11px]">{hoveredAction.description}</div>
          )}
          {hoveredAction.player && (
            <div className="mt-1 text-[11px] text-neutral-400">Player: {hoveredAction.player}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default Timeline;