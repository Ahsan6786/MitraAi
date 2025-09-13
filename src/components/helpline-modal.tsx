
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone, User } from 'lucide-react';
import Link from 'next/link';
import type { EmergencyContact } from './sos-button';

interface HelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyContact: EmergencyContact | null;
}

// KIRAN Mental Health Helpline - Government of India
const HELPLINE_NUMBER = '1800-599-0019';
const HELPLINE_TEL_LINK = 'tel:18005990019';

export default function HelplineModal({ isOpen, onClose, emergencyContact }: HelplineModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Immediate Help Available
          </DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            If you are in distress or need immediate support, please choose an option below. You are not alone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
            {emergencyContact && (
                <Button asChild className="w-full h-auto py-3" size="lg">
                    <Link href={`tel:${emergencyContact.phone}`}>
                        <User className="mr-3 h-5 w-5" />
                        <div className="text-left">
                            <p className="font-semibold">Call {emergencyContact.name}</p>
                            <p className="text-xs font-normal">{emergencyContact.phone}</p>
                        </div>
                    </Link>
                </Button>
            )}

            <Button asChild className="w-full h-auto py-3" size="lg" variant={emergencyContact ? "secondary" : "default"}>
                <Link href={HELPLINE_TEL_LINK}>
                    <Phone className="mr-3 h-5 w-5" />
                    <div className="text-left">
                        <p className="font-semibold">Call KIRAN Helpline</p>
                        <p className="text-xs font-normal">{HELPLINE_NUMBER}</p>
                    </div>
                </Link>
            </Button>
        </div>

        <DialogFooter>
           <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
