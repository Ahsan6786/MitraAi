
'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat-interface';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { MessageSquare } from 'lucide-react';

function ChatPageContent() {
  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}

export default function ChatPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenChatIntro';

    useEffect(() => {
        setIsClient(true);
        const hasSeen = sessionStorage.getItem(SESSION_KEY);
        if (hasSeen) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <SectionIntroAnimation 
            onFinish={handleIntroFinish} 
            icon={<MessageSquare className="w-full h-full" />}
            title="MitraGPT"
            subtitle="Your personal AI companion."
        />;
    }

    return <ChatPageContent />;
}
