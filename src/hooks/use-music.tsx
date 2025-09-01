
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
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(musicTracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforePause = useRef(false);

  useEffect(() => {
    // This effect runs only once to initialize the audio element.
    if (typeof window !== 'undefined' && !audioRef.current) {
        const audio = new Audio();
        audio.loop = false;
        
        // Preload the first track to ensure there's always a source
        if (musicTracks.length > 0) {
            audio.src = musicTracks[0].url;
            setCurrentTrack(musicTracks[0]);
        }

        audio.addEventListener('ended', () => {
          // playNext is defined below but accessible here due to closure
          playNextRef.current();
        });
        
        audioRef.current = audio;
    }
    
    // Cleanup the event listener when the component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => playNextRef.current());
      }
    }
  }, []);


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

  const playNext = useCallback(() => {
    const currentId = currentTrack?.id ?? musicTracks[0]?.id ?? -1;
    const currentIndex = musicTracks.findIndex(t => t.id === currentId);
    const nextIndex = (currentIndex + 1) % musicTracks.length;
    playTrack(musicTracks[nextIndex].id);
  }, [currentTrack, playTrack]);
  
  // Ref to hold the latest version of playNext callback for the event listener
  const playNextRef = useRef(playNext);
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
    } else {
        // The audio element is guaranteed to have a source from the useEffect
        if (audioRef.current) {
             audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => console.error("Error playing music:", error));
        }
    }
  }, [isPlaying]);
  
  const playPrevious = useCallback(() => {
    const currentId = currentTrack?.id ?? musicTracks[0]?.id ?? -1;
    const currentIndex = musicTracks.findIndex(t => t.id === currentId);
    const prevIndex = (currentIndex - 1 + musicTracks.length) % musicTracks.length;
    playTrack(musicTracks[prevIndex].id);
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
