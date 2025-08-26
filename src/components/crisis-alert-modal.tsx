
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/text-to-speech';

interface CrisisAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALERT_MESSAGE = "It sounds like you are going through a difficult time. Please know that life is precious and help is available. We strongly encourage you to talk to a family member, a friend, or a professional immediately.";

export default function CrisisAlertModal({ isOpen, onClose }: CrisisAlertModalProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const speakMessage = async () => {
        setIsSpeaking(true);
        try {
          const result = await textToSpeech({ text: ALERT_MESSAGE });
          if (result.audioDataUri) {
            const audioInstance = new Audio(result.audioDataUri);
            setAudio(audioInstance);
            audioInstance.play();
            audioInstance.onended = () => setIsSpeaking(false);
          } else {
            // If audio fails to generate, just stop the speaking indicator
            setIsSpeaking(false);
          }
        } catch (error) {
          console.error("Failed to generate speech for crisis alert:", error);
          setIsSpeaking(false);
        }
      };
      speakMessage();
    } else {
        // Cleanup when modal is closed
        if (audio) {
            audio.pause();
            setAudio(null);
        }
        setIsSpeaking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    if (audio) {
      audio.pause();
    }
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            An Important Message
          </DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            {ALERT_MESSAGE}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            {isSpeaking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSpeaking ? '...' : 'I Understand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
