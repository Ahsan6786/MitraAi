
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { musicTracks, type MusicTrack } from '@/lib/music-data';

interface MusicContextType {
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentTrack: MusicTrack | null;
  setCurrentTrack: (track: MusicTrack | null) => void;
  playNext: () => void;
  playPrevious: () => void;
  playTrack: (trackId: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(musicTracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = useCallback((trackId: number) => {
    const track = musicTracks.find(t => t.id === trackId);
    if (track) {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  }, []);

  const playNext = useCallback(() => {
    if (!currentTrack) {
        playTrack(musicTracks[0].id);
        return;
    }
    const currentIndex = musicTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % musicTracks.length;
    playTrack(musicTracks[nextIndex].id);
  }, [currentTrack, playTrack]);

  const playPrevious = useCallback(() => {
     if (!currentTrack) {
        playTrack(musicTracks[0].id);
        return;
    }
    const currentIndex = musicTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + musicTracks.length) % musicTracks.length;
    playTrack(musicTracks[prevIndex].id);
  }, [currentTrack, playTrack]);


  return (
    <MusicContext.Provider value={{ isPlaying, setIsPlaying, currentTrack, setCurrentTrack, playNext, playPrevious, playTrack }}>
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
