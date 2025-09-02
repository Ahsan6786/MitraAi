
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

interface StartQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function StartQuestionnaireModal({ isOpen, onClose, onConfirm }: StartQuestionnaireModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-primary" />
            Wellness Screening
          </DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            It looks like you haven't taken a screening test yet. Would you like to take a quick, confidential test to gain insights into your well-being?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
          <Button onClick={onConfirm} className="w-full">
            Yes, Start a Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
