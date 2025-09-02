
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ChatInterface from '@/components/chat-interface';

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">MitraAI</h1>
            <p className="text-sm text-muted-foreground">Your Personal AI Companion</p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-auto bg-muted/30 flex justify-center py-5">
        <div className="flex flex-col w-full max-w-4xl h-full">
            <div className="text-center p-4">
                <h1 className="text-foreground text-4xl font-bold leading-tight">AI Chat</h1>
                <p className="text-muted-foreground text-base font-normal leading-normal mt-2 max-w-2xl mx-auto">Engage in private, multi-language text-based conversations with our AI companion. This space is designed for your comfort and privacy, allowing you to express yourself freely and receive support in a calming environment.</p>
            </div>
            <ChatInterface />
        </div>
      </main>
    </div>
  );
}
