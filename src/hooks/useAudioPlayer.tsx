import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkFileExists = async (url: string): Promise<boolean> => {
    try {
      console.log('Checking if file exists:', url);
      const response = await fetch(url, { method: 'HEAD' });
      console.log('File check response:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  };

  const loadAudio = async (src: string) => {
    console.log('=== Starting audio load process ===');
    console.log('Loading audio from:', src);
    
    // Show immediate feedback - removed loading toast
    setIsVisible(true);
    setIsLoading(true);
    setError(null);
    setIsMinimized(false);
    
    // First check if file exists
    const fileExists = await checkFileExists(src);
    if (!fileExists) {
      console.error('Audio file does not exist or is not accessible:', src);
      setError('Audio file not found. Please check if the file exists.');
      setIsLoading(false);
      return;
    }
    
    console.log('File exists, proceeding with audio load...');
    
    if (audioRef.current) {
      console.log('Audio element found, setting src...');
      audioRef.current.src = src;
      
      // Try to load the audio
      console.log('Calling audio.load()...');
      audioRef.current.load();
    } else {
      console.error('Audio element not found!');
      setError('Audio player not initialized properly');
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('No audio element available for playback');
      return;
    }
    
    console.log('=== Toggle play called ===');
    console.log('Current playing state:', isPlaying);
    console.log('Audio element src:', audioRef.current.src);
    console.log('Audio element readyState:', audioRef.current.readyState);
    console.log('Audio element duration:', audioRef.current.duration);
    
    try {
      if (isPlaying) {
        console.log('Pausing audio...');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio...');
        console.log('Audio element networkState:', audioRef.current.networkState);
        
        if (audioRef.current.readyState === 0) {
          console.log('Audio not ready, trying to load first...');
          audioRef.current.load();
          // Wait a bit for loading to start
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const playPromise = audioRef.current.play();
        console.log('Play promise created:', playPromise);
        
        await playPromise;
        console.log('Audio play successful!');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error during audio playback:', error);
      setError(`Failed to play audio: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const seek = useCallback((time: number) => {
    console.log('=== Seek function called ===');
    console.log('Seeking to time:', time);
    
    if (!audioRef.current || isNaN(time) || time < 0 || !audioRef.current.duration) {
      console.warn('Invalid seek conditions:', { 
        time, 
        hasAudio: !!audioRef.current, 
        duration: audioRef.current?.duration,
        readyState: audioRef.current?.readyState 
      });
      return;
    }

    // Clear any existing seek timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    // Check if the position is within buffered ranges
    const audio = audioRef.current;
    const seekTime = Math.min(time, audio.duration);
    
    console.log('Current audio time:', audio.currentTime);
    console.log('Audio duration:', audio.duration);
    console.log('Audio readyState:', audio.readyState);
    console.log('Buffered ranges:', audio.buffered.length);
    
    // Check if the seek position is buffered
    let isBuffered = false;
    for (let i = 0; i < audio.buffered.length; i++) {
      const start = audio.buffered.start(i);
      const end = audio.buffered.end(i);
      console.log(`Buffered range ${i}: ${start} - ${end}`);
      if (seekTime >= start && seekTime <= end) {
        isBuffered = true;
        break;
      }
    }
    
    console.log('Seek position buffered:', isBuffered);
    
    // Set seeking state immediately for UI feedback
    setIsSeeking(true);
    
    // Debounce the actual seek operation
    seekTimeoutRef.current = setTimeout(() => {
      try {
        console.log('Executing debounced seek to:', seekTime);
        
        // Only seek if audio is ready and position is valid
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          audio.currentTime = seekTime;
          console.log('Audio currentTime after setting:', audio.currentTime);
          
          // Update state immediately
          setCurrentTime(seekTime);
        } else {
          console.warn('Audio not ready for seeking, readyState:', audio.readyState);
        }
        
      } catch (error) {
        console.error('Error during seek operation:', error);
      } finally {
        // Reset seeking state
        setIsSeeking(false);
      }
    }, 150); // 150ms debounce
    
  }, []);

  const changeVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const closePlayer = () => {
    console.log('Closing audio player...');
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsVisible(false);
      setCurrentTime(0);
      setError(null);
      setIsLoading(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const retryLoad = () => {
    if (audioRef.current && audioRef.current.src) {
      console.log('Retrying audio load...');
      setError(null);
      setIsLoading(true);
      audioRef.current.load();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      // Only update time if we're not actively seeking
      if (!isSeeking) {
        console.log('Time update:', audio.currentTime);
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      console.log('=== Audio metadata loaded ===');
      console.log('Duration:', audio.duration);
      console.log('Ready state:', audio.readyState);
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleEnded = () => {
      console.log('Audio playback ended');
      setIsPlaying(false);
    };
    
    const handleError = (e: Event) => {
      console.error('=== Audio error event ===', e);
      const target = e.target as HTMLAudioElement;
      let errorMessage = 'Unknown audio error';
      
      if (target.error) {
        console.error('Audio error details:', {
          code: target.error.code,
          message: target.error.message
        });
        
        switch (target.error.code) {
          case target.error.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback was aborted';
            break;
          case target.error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred while loading audio';
            break;
          case target.error.MEDIA_ERR_DECODE:
            errorMessage = 'Audio file format not supported';
            break;
          case target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio file not found or format not supported';
            break;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
    };
    
    const handleLoadStart = () => {
      console.log('=== Audio load started ===');
      setIsLoading(true);
    };
    
    const handleCanPlay = () => {
      console.log('=== Audio can start playing ===');
      console.log('Ready state:', audio.readyState);
      console.log('Duration:', audio.duration);
      setIsLoading(false);
    };
    
    const handleLoadedData = () => {
      console.log('=== Audio data loaded ===');
      console.log('Ready state:', audio.readyState);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        console.log('Audio buffering progress:', {
          bufferedStart: audio.buffered.start(0),
          bufferedEnd: audio.buffered.end(0),
          duration: audio.duration
        });
      }
    };

    const handleSuspend = () => {
      console.log('Audio loading suspended');
    };

    const handleStalled = () => {
      console.log('Audio loading stalled');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('stalled', handleStalled);
      
      // Clean up timeout on unmount
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, [isSeeking]);

  return {
    audioRef,
    isPlaying,
    duration,
    currentTime,
    volume,
    isVisible,
    isMinimized,
    isLoading,
    error,
    loadAudio,
    togglePlay,
    seek,
    changeVolume,
    closePlayer,
    toggleMinimize,
    retryLoad,
  };
};
