
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import HelplineModal from './helpline-modal';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface EmergencyContact {
    name: string;
    phone: string;
}

export function SOSButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSOSClick = async () => {
    if (!user) {
        toast({ title: "Please sign in to use this feature.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.emergencyContactName && data.emergencyContactPhone) {
                setEmergencyContact({
                    name: data.emergencyContactName,
                    phone: data.emergencyContactPhone,
                });
            } else {
                 setEmergencyContact(null);
            }
        }
        setIsModalOpen(true);
    } catch (error) {
        toast({ title: "Could not fetch emergency contact.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleSOSClick}
        disabled={isLoading}
        aria-label="SOS Emergency"
        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {isLoading ? <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" /> : <AlertTriangle className="h-[1.2rem] w-[1.2rem]" />}
      </Button>
      <HelplineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        emergencyContact={emergencyContact}
      />
    </>
  );
}
