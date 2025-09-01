
'use client';

import { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from 'react';
import { musicTracks, type MusicTrack } from '@/lib/music-data';

interface MusicContextType {
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  playTrack: (trackId: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  // Exposing these for specific use cases like pausing for voice input
  pauseMusic: () => void;
  resumeMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforePause = useRef(false);

  // Memoize playNext to prevent re-creation
  const playNext = useCallback(() => {
    if (currentTrack) {
        const currentIndex = musicTracks.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % musicTracks.length;
        playTrack(musicTracks[nextIndex].id);
    } else if (musicTracks.length > 0) {
        playTrack(musicTracks[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = false;

        const handleEnded = () => playNext();
        audioRef.current.addEventListener('ended', handleEnded);

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('ended', handleEnded);
            }
        }
    }
  }, [playNext]);

  const playTrack = useCallback((trackId: number) => {
    const track = musicTracks.find(t => t.id === trackId);
    if (track && audioRef.current) {
        setCurrentTrack(track);
        audioRef.current.src = track.url;
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(error => console.error("Error playing music:", error));
    }
  }, []);
  
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
    } else {
        if (!currentTrack && musicTracks.length > 0) {
            // If no track is selected, start with the first one
            playTrack(musicTracks[0].id);
        } else if (audioRef.current?.src) {
             audioRef.current?.play().then(() => {
                setIsPlaying(true);
            }).catch(error => console.error("Error playing music:", error));
        }
    }
  }, [isPlaying, currentTrack, playTrack]);
  
  const playPrevious = useCallback(() => {
    if (currentTrack) {
        const currentIndex = musicTracks.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + musicTracks.length) % musicTracks.length;
        playTrack(musicTracks[prevIndex].id);
    } else if (musicTracks.length > 0) {
        playTrack(musicTracks[musicTracks.length - 1].id);
    }
  }, [currentTrack, playTrack]);


  const pauseMusic = useCallback(() => {
    if (audioRef.current && isPlaying) {
        wasPlayingBeforePause.current = true;
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        wasPlayingBeforePause.current = false;
    }
  }, [isPlaying]);
  
  const resumeMusic = useCallback(() => {
     if (audioRef.current && wasPlayingBeforePause.current) {
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(error => console.error("Error resuming music:", error));
    }
    wasPlayingBeforePause.current = false; // Reset the flag
  }, []);

  return (
    <MusicContext.Provider value={{ isPlaying, currentTrack, playTrack, togglePlayPause, playNext, playPrevious, pauseMusic, resumeMusic }}>
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
