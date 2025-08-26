
'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, Send, User, MessageCircleHeart, Smile, Frown, Meh } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { predictChatMood } from '@/ai/flows/predict-chat-mood';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: number;
  sender: 'user';
  text: string;
  mood?: string;
}

const MoodIcon = ({ mood }: { mood: string | undefined }) => {
  if (!mood) return null;
  const moodLower = mood.toLowerCase();
  if (moodLower.includes('happy') || moodLower.includes('joy')) {
    return <Smile className="w-5 h-5 text-green-500" />;
  }
  if (moodLower.includes('sad') || moodLower.includes('depressed')) {
    return <Frown className="w-5 h-5 text-blue-500" />;
  }
  if (moodLower.includes('anxious') || moodLower.includes('stressed') || moodLower.includes('worried')) {
    return <Meh className="w-5 h-5 text-yellow-500" />;
  }
  return <Meh className="w-5 h-5 text-gray-500" />;
};


export default function MoodChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await predictChatMood({ message: messageText });
      const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: messageText,
        mood: result.mood,
      };
      setMessages((prev) => [...prev, userMessage]);
      
      // Save to Firestore for admin review
      await addDoc(collection(db, 'journalEntries'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'mood-chat',
        content: messageText,
        mood: result.mood,
        createdAt: serverTimestamp(),
        reviewed: false,
        doctorReport: null,
      });
      
      toast({
          title: "Mood Analyzed",
          description: `Your message has been saved with the mood: ${result.mood}. A doctor may review it.`
      })

    } catch (error) {
      console.error('Error getting mood analysis:', error);
       const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: messageText,
        mood: "Error",
      };
      setMessages((prev) => [...prev, userMessage]);
      toast({
          title: "Analysis Failed",
          description: "Could not analyze or save your message.",
          variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">Mood Chat</h1>
            <p className="text-sm text-muted-foreground">Get real-time mood analysis from your chat.</p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-10 md:pt-20 text-center">
                 <MessageCircleHeart className="w-16 h-16 md:w-20 md:h-20 text-primary mb-6" />
                 <h2 className="text-xl md:text-2xl font-semibold">How are you feeling right now?</h2>
                 <p className="text-muted-foreground mt-2 max-w-xs sm:max-w-sm">Type a message below. The AI will analyze its mood and save it for professional review.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex flex-col items-end gap-2">
                    <div className="flex items-start gap-3 justify-end w-full">
                         <div
                            className={cn('max-w-[80%] rounded-xl px-4 py-3 text-sm md:text-base shadow-sm md:max-w-md lg:max-w-lg bg-primary text-primary-foreground rounded-br-none')}
                          >
                            <p>{message.text}</p>
                          </div>
                           <Avatar className="w-8 h-8 md:w-9 md:h-9 border">
                              <AvatarFallback>
                                 {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4 md:w-5 md:h-5" />}
                              </AvatarFallback>
                            </Avatar>
                    </div>
                     {message.mood && (
                       <Badge variant="secondary" className="capitalize flex items-center gap-2">
                         <MoodIcon mood={message.mood} /> {message.mood}
                       </Badge>
                     )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t bg-background p-2 md:p-4">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message to analyze its mood..."
            className="flex-1"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
