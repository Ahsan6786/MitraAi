
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatInterface from '@/components/chat-interface';
import { ChatHistorySidebar } from '@/components/chat-history-sidebar';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { MessageSquare } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

function ChatPageContent() {
    const params = useParams();
    const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : undefined;
    const sidebar = useSidebar();

    return (
        <div className="h-full flex">
            {/* Pass conversationId to the sidebar */}
            <ChatHistorySidebar currentConversationId={conversationId} />
            
            {/* Main Chat Interface */}
            <div className="flex-1 h-full">
                <ChatInterface conversationId={conversationId} />
            </div>
             {sidebar && !sidebar.openMobile && (
                 <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <button 
                      onClick={() => sidebar.setOpenMobile(true)}
                      className="bg-background text-foreground rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border"
                    >
                      <MessageSquare className="h-5 w-5"/>
                      Show Chats
                    </button>
                 </div>
            )}
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
    
    // The intro animation is only shown on the very first visit
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
