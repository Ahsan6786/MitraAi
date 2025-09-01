
'use client';

import { useState, useRef, useEffect } from 'react';
import { useMusic } from '@/hooks/use-music';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Play, Pause, SkipForward, SkipBack, Music, ListMusic } from 'lucide-react';
import { musicTracks } from '@/lib/music-data';

function Playlist() {
  const { currentTrack, playTrack, isPlaying } = useMusic();

  return (
    <div className="space-y-2 p-2">
      {musicTracks.map(track => (
        <button
          key={track.id}
          className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-4 ${
            currentTrack?.id === track.id ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
          }`}
          onClick={() => playTrack(track.id)}
        >
          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
            {currentTrack?.id === track.id && isPlaying ? (
              <Music className="w-5 h-5 animate-pulse" />
            ) : (
              <Music className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-semibold">{track.title}</p>
            <p className="text-sm text-muted-foreground">{track.artist}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function MusicPlayer() {
  const { isPlaying, setIsPlaying, currentTrack, playNext, playPrevious } = useMusic();
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
        audioRef.current.src = currentTrack.url;
        if (isPlaying) {
             audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    }
  }, [currentTrack, isPlaying]);

  const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={playNext}
        loop={false}
      />
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg border backdrop-blur-sm bg-background/80">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                 <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">
                  {currentTrack?.title || 'Select Music'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack?.artist || 'From the playlist'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={playPrevious}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={playNext}>
                <SkipForward className="w-5 h-5" />
              </Button>
               <Sheet open={isPlaylistOpen} onOpenChange={setIsPlaylistOpen}>
                  <SheetTrigger asChild>
                       <Button variant="ghost" size="icon">
                          <ListMusic className="w-5 h-5" />
                      </Button>
                  </SheetTrigger>
                  <SheetContent>
                      <SheetHeader>
                          <SheetTitle>Soothing Sounds</SheetTitle>
                      </SheetHeader>
                      <Playlist />
                  </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
