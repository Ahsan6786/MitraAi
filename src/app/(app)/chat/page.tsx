
'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Languages, Loader2, Mic, Send, User, Square } from 'lucide-react';
import { chatEmpatheticTone } from '@/ai/flows/chat-empathetic-tone';
import { Logo } from '@/components/icons';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isRecording, setIsRecording] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [userName, setUserName] = useState('friend');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    async function fetchUserName() {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().name) {
          setUserName(userDoc.data().name);
        } else {
          setUserName('friend');
        }
      }
    }
    fetchUserName();
  }, [user]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !user) return;

    const userMessage: Message = { sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // First, check for crisis
      const crisisResult = await detectCrisis({ message: messageText });
      if (crisisResult.isCrisis) {
        setShowCrisisModal(true);
        // We can stop here and not get a regular chat response
        setIsLoading(false);
        return;
      }

      const chatResult = await chatEmpatheticTone({ message: messageText, language, userName });
      
      const aiMessage: Message = { sender: 'ai', text: chatResult.response };
      setMessages((prev) => [...prev, aiMessage]);

      // If voice was used, convert AI response to speech
      if (isRecording) {
        if (chatResult.response.trim()) {
            const ttsResult = await textToSpeech({ text: chatResult.response });
            if (ttsResult.audioDataUri) {
                const audio = new Audio(ttsResult.audioDataUri);
                audioRef.current = audio;
                audio.play();
            }
        }
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Only set isRecording to false if it was a voice message
      if (recognitionRef.current) {
        setIsRecording(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  const handleVoiceButtonClick = () => {
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Speech API for voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
       recognitionRef.current?.stop();
       setIsRecording(false);
    } else {
        setIsRecording(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleSendMessage(transcript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            toast({
                title: "Voice Error",
                description: "There was an error with voice recognition. Please try again.",
                variant: "destructive",
            });
            setIsRecording(false);
        };
        
         recognitionRef.current.onend = () => {
            // Check if it ended naturally or was stopped manually
            if (recognitionRef.current) {
               setIsRecording(false);
            }
        };

        recognitionRef.current.start();
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <CrisisAlertModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />
      <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">AI Companion</h1>
            <p className="text-sm text-muted-foreground">Chat with MitraAI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Languages className="w-5 h-5 text-muted-foreground hidden sm:block"/>
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Hinglish">Hinglish</SelectItem>
                    <SelectItem value="Bhojpuri">Bhojpuri</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-10 md:pt-20 text-center">
                 <Logo className="w-16 h-16 md:w-20 md:h-20 text-primary mb-6" />
                 <h2 className="text-xl md:text-2xl font-semibold">Hello, {userName}! How are you feeling?</h2>
                 <p className="text-muted-foreground mt-2 max-w-xs sm:max-w-sm">I'm here to listen. Share anything on your mind, and we can talk through it together.</p>
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
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Logo className="w-4 h-4 md:w-5 md:h-5"/>
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-xl px-4 py-3 text-sm md:text-base shadow-sm md:max-w-md lg:max-w-lg',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background text-card-foreground rounded-bl-none border'
                    )}
                  >
                    <p>{message.text}</p>
                  </div>
                   {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 border">
                      <AvatarFallback>
                         {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4 md:w-5 md:h-5" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Logo className="w-4 h-4 md:w-5 md:h-5"/>
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-background text-card-foreground rounded-xl px-4 py-3 shadow-sm rounded-bl-none border flex items-center text-sm md:text-base">
                      <Loader2 className="w-5 h-5 animate-spin mr-2"/> Thinking...
                    </div>
               </div>
            )}
            {isRecording && (
                <div className="flex items-start gap-3 justify-center">
                   <div className="bg-background text-card-foreground rounded-xl px-4 py-3 shadow-sm border flex items-center text-sm md:text-base">
                       <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div> Listening...
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t bg-background p-2 md:p-4">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading || isRecording}
            autoComplete="off"
          />
          <Button type="button" variant={isRecording ? 'destructive' : 'ghost'} size="icon" onClick={handleVoiceButtonClick} disabled={isLoading}>
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="sr-only">{isRecording ? 'Stop Recording' : 'Use Voice'}</span>
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || isRecording || !input.trim()}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
