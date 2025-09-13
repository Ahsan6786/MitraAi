
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import HelplineModal from './helpline-modal';

export function SOSButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        aria-label="SOS Emergency"
      >
        <AlertTriangle className="h-[1.2rem] w-[1.2rem]" />
      </Button>
      <HelplineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
