
'use client';

import { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  playMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const MUSIC_URL = '/relaxing-music.mp3';

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforePause = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio(MUSIC_URL);
        audioRef.current.loop = true;
    }
  }, []);

  const playMusic = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(error => console.error("Error playing music:", error));
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (audioRef.current && audioRef.current.played && !audioRef.current.paused) {
        wasPlayingBeforePause.current = true;
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        wasPlayingBeforePause.current = false;
    }
  }, []);
  
  const resumeMusic = useCallback(() => {
     if (audioRef.current && wasPlayingBeforePause.current) {
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(error => console.error("Error resuming music:", error));
        wasPlayingBeforePause.current = false; // Reset the flag
    }
  }, []);

  return (
    <MusicContext.Provider value={{ isPlaying, playMusic, pauseMusic, resumeMusic }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
