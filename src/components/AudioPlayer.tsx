
import { Play, Pause, Volume2, X, Minimize2, Maximize2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isVisible: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
  onToggleMinimize: () => void;
  onRetryLoad: () => void;
}

const AudioPlayer = ({
  audioRef,
  isPlaying,
  duration,
  currentTime,
  volume,
  isVisible,
  isMinimized,
  isLoading,
  error,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onClose,
  onToggleMinimize,
  onRetryLoad,
}: AudioPlayerProps) => {
  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg shadow-2xl transition-all duration-300 z-50 ${
        isMinimized ? 'w-16 h-16' : 'w-80 h-32'
      }`}
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)' }}
    >
      <audio ref={audioRef} preload="metadata" />
      
      {isMinimized ? (
        // Minimized view
        <div className="w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePlay}
            disabled={isLoading || !!error}
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : error ? (
              <AlertCircle className="w-5 h-5" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-600 hover:bg-slate-700 text-white"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        // Full view
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              Retirement Spending Podcast
            </h3>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="w-6 h-6 p-0 hover:bg-slate-100"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-6 h-6 p-0 hover:bg-slate-100"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetryLoad}
                className="w-6 h-6 p-0 hover:bg-red-100"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Loading Message */}
          {isLoading && !error && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Loading audio...</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePlay}
              disabled={isLoading || !!error}
              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white p-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            {/* Progress */}
            <div className="flex-1 space-y-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={([value]) => onSeek(value)}
                disabled={isLoading || !!error || !duration}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => onVolumeChange(value / 100)}
                disabled={isLoading || !!error}
                className="w-16"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
