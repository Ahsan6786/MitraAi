
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowRight } from 'lucide-react';
import { screeningToolsData } from '@/lib/screening-tools';
import { useRouter } from 'next/navigation';

interface StartQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function StartQuestionnaireModal({ isOpen, onClose, onConfirm }: StartQuestionnaireModalProps) {
  const router = useRouter();

  const handleTestSelection = (testId: string) => {
    onConfirm();
    router.push(`/questionnaire?test=${testId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()} // Prevents closing on outside click
        hideCloseButton={true} // Prevent the 'x' button from showing
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-primary" />
            Welcome to MitraAI! Let's Begin.
          </DialogTitle>
          <DialogDescription className="pt-4 text-base text-foreground">
            To get started on your wellness journey, please select one of the confidential screening tests below. This will help us understand your current well-being.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {Object.values(screeningToolsData).map((tool) => (
                <Button
                    key={tool.id}
                    variant="outline"
                    className="h-auto justify-between py-3 px-4 text-left"
                    onClick={() => handleTestSelection(tool.id)}
                >
                    <div>
                        <p className="font-semibold">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.purpose}</p>
                    </div>
                    <ArrowRight className="w-5 h-5" />
                </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
