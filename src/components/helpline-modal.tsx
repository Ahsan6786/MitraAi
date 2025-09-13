
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone } from 'lucide-react';
import Link from 'next/link';

interface HelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// KIRAN Mental Health Helpline - Government of India
const HELPLINE_NUMBER = '1800-599-0019';
const HELPLINE_TEL_LINK = 'tel:18005990019';

export default function HelplineModal({ isOpen, onClose }: HelplineModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Immediate Help Available
          </DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            If you are in distress or need immediate support, please reach out. You are not alone.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">KIRAN Mental Health Helpline (India)</p>
            <p className="text-2xl font-bold tracking-wider">{HELPLINE_NUMBER}</p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
           <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
          <Button asChild className="w-full">
            <Link href={HELPLINE_TEL_LINK}>
                <Phone className="mr-2 h-4 w-4" />
                Call Now
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
