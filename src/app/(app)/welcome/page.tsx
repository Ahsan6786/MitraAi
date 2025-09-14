
'use client';

import { useState, useEffect } from 'react';
import SectionIntroAnimation from '@/components/section-intro-animation';
import StartQuestionnaireModal from '@/components/start-questionnaire-modal';
import { BookHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
    const [showIntro, setShowIntro] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    const handleIntroFinish = () => {
        setShowIntro(false);
        setShowModal(true);
    };

    const handleModalConfirm = () => {
        setShowModal(false);
        // The modal itself will handle the redirect, but as a fallback:
        // router.push('/screening-tools'); 
    };
    
    // This is a special case page, so we don't need a modal close handler
    // as the modal is non-dismissible.

    return (
        <div className="h-full flex flex-col">
            {showIntro && (
                 <SectionIntroAnimation 
                    onFinish={handleIntroFinish} 
                    icon={<BookHeart className="w-full h-full" />}
                    title="Welcome to MitraAI"
                    subtitle="Please give the screening test to understand your current well being."
                />
            )}
            
            <StartQuestionnaireModal
                isOpen={showModal}
                onConfirm={handleModalConfirm}
                onClose={() => {}} // Non-dismissible, so this is a no-op
            />

             {/* Fallback content in case the animation/modal flow has issues */}
            {!showIntro && !showModal && (
                <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                        <h1 className="text-2xl font-bold">Loading your experience...</h1>
                        <p className="text-muted-foreground">Please wait.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
