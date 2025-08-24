
'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMusic } from '@/hooks/use-music';
import { Music2 } from 'lucide-react';

export default function MusicPlayer() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { playMusic, isPlaying } = useMusic();

  useEffect(() => {
    // Do not show the prompt if music is already playing
    if (isPlaying) {
      return;
    }
    
    // Check if the prompt has been shown in this session
    if (sessionStorage.getItem('musicPrompted')) {
      return;
    }

    const timer = setTimeout(() => {
      // Final check before showing the prompt
      if (!isPlaying && !sessionStorage.getItem('musicPrompted')) {
        setShowPrompt(true);
        sessionStorage.setItem('musicPrompted', 'true');
      }
    }, 15000); // 15 seconds

    return () => clearTimeout(timer);
  }, [isPlaying]);

  const handlePlayMusic = () => {
    playMusic();
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  return (
    <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Relaxing Music
          </AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to listen to some calming background music to help you relax?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>No, thanks</AlertDialogCancel>
          <AlertDialogAction onClick={handlePlayMusic}>Yes, play music</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
