'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, Mic, Send, User } from 'lucide-react';
import { chatEmpatheticTone } from '@/ai/flows/chat-empathetic-tone';
import { Logo } from '@/components/icons';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatEmpatheticTone({ message: input, language: 'Hindi' });
      const aiMessage: Message = { sender: 'ai', text: result.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <header className="border-b bg-background p-4">
        <h1 className="text-xl font-bold font-headline">AI Companion</h1>
        <p className="text-sm text-muted-foreground">Chat with MitraAI in Hindi</p>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
                 <Logo className="w-20 h-20 text-primary mb-6" />
                 <h2 className="text-2xl font-semibold">Hello! How are you feeling?</h2>
                 <p className="text-muted-foreground mt-2 max-w-sm">I'm here to listen. Share anything on your mind, and we can talk through it together.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="w-9 h-9 border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Logo className="w-5 h-5"/>
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-base shadow-sm',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background text-card-foreground rounded-bl-none border'
                    )}
                  >
                    <p>{message.text}</p>
                  </div>
                   {message.sender === 'user' && (
                    <Avatar className="w-9 h-9 border">
                      <AvatarFallback>
                        <User className="w-5 h-5"/>
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-9 h-9 border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Logo className="w-5 h-5"/>
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-background text-card-foreground rounded-xl px-4 py-3 shadow-sm rounded-bl-none border flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2"/> Thinking...
                    </div>
               </div>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 text-base"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="button" variant="ghost" size="icon" disabled>
            <Mic className="w-5 h-5" />
            <span className="sr-only">Use Voice</span>
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
