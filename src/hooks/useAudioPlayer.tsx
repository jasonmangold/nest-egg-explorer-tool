
import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadAudio = (src: string) => {
    if (audioRef.current) {
      audioRef.current.src = src;
      setIsVisible(true);
      setIsMinimized(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsVisible(false);
      setCurrentTime(0);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return {
    audioRef,
    isPlaying,
    duration,
    currentTime,
    volume,
    isVisible,
    isMinimized,
    loadAudio,
    togglePlay,
    seek,
    changeVolume,
    closePlayer,
    toggleMinimize,
  };
};
