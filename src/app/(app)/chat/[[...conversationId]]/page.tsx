
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatInterface from '@/components/chat-interface';
import { ChatHistorySidebar, ChatHistorySidebarProvider, useChatHistorySidebar } from '@/components/chat-history-sidebar';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';


function ChatPageContent() {
    const params = useParams();
    const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : undefined;
    const chatHistorySidebar = useChatHistorySidebar();

    return (
        <div className="h-full flex">
            {/* Pass conversationId to the sidebar */}
            <ChatHistorySidebar currentConversationId={conversationId} />
            
            {/* Main Chat Interface */}
            <div className="flex-1 h-full">
                <ChatInterface conversationId={conversationId} />
            </div>
             
             {/* Mobile-only button to show chats */}
             {!chatHistorySidebar.isOpen && (
                 <div className="md:hidden fixed bottom-6 right-4 z-50">
                    <Button 
                      onClick={() => chatHistorySidebar.setIsOpen(true)}
                      className="rounded-full shadow-lg h-12 px-5"
                    >
                      <MessageSquare className="h-5 w-5 mr-2"/>
                      Show Chats
                    </Button>
                 </div>
            )}
        </div>
    );
}


function ChatPageWrapper() {
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

export default function ChatPage() {
    return (
        <ChatHistorySidebarProvider>
            <ChatPageWrapper />
        </ChatHistorySidebarProvider>
    )
}
