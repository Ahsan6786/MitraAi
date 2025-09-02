
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import ChatInterface from '@/components/chat-interface';

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-lg md:text-xl font-bold">MitraGPT</h1>
            <p className="text-sm text-muted-foreground">Your Personal AI Companion</p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-auto bg-muted/30 p-0 sm:p-4">
          <ChatInterface />
      </main>
    </div>
  );
}
