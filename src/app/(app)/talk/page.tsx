
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Languages, Loader2, Mic, User, Square, Phone, Bot } from 'lucide-react';
import { chatEmpatheticTone } from '@/ai/flows/chat-empathetic-tone';
import { Logo } from '@/components/icons';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';


interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  
const languageToSpeechCode: Record<string, string> = {
    English: 'en-US',
    Hindi: 'hi-IN',
    Hinglish: 'en-IN',
    Arabic: 'ar-SA',
    French: 'fr-FR',
    German: 'de-DE',
    Bhojpuri: 'en-IN', // No specific code, fallback to a regional one
};


export default function TalkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('English');
  const [transcript, setTranscript] = useState('');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef(''); // Use a ref to hold the latest transcript
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleAiResponse = async (messageText: string) => {
    if (!messageText.trim() || !user) return;
    const userMessage: Message = { sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
       // First, check for crisis
      const crisisResult = await detectCrisis({ message: messageText });
      if (crisisResult.isCrisis) {
        setShowCrisisModal(true);
        setIsLoading(false);
        return;
      }
      
      const userName = user.email?.split('@')[0] || 'friend';
      const result = await chatEmpatheticTone({ message: messageText, language, userName });
      const aiMessage: Message = { sender: 'ai', text: result.response };
      
      const ttsResult = await textToSpeech({ text: result.response });
      setMessages((prev) => [...prev, aiMessage]);
      const audio = new Audio(ttsResult.audioDataUri);
      audioRef.current = audio;
      audio.play();
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      
      const finalTranscript = transcriptRef.current;
      if (finalTranscript.trim()) {
        handleAiResponse(finalTranscript);
      }
      setTranscript('');
      transcriptRef.current = '';
    }
  }, []); 

  const startRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
    }

    setIsRecording(true);
    setTranscript('');
    transcriptRef.current = '';
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = languageToSpeechCode[language] || 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
      
      // Reset the silence timer
      silenceTimeoutRef.current = setTimeout(() => {
          stopRecording();
      }, 1500); // Stop after 1.5 seconds of silence
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
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }
        // Check if the recording was stopped intentionally or automatically
        if (recognitionRef.current) {
           stopRecording();
        }
    }

    recognitionRef.current.start();
  };

  const handleMicClick = () => {
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Speech API.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
            <h1 className="text-lg md:text-xl font-bold">Talk to Mitra</h1>
            <p className="text-sm text-muted-foreground">Have a live voice conversation.</p>
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
      <main className="flex-1 overflow-hidden p-2 sm:p-4 md:p-6 flex flex-col">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-2 md:p-4 space-y-6">
            {messages.length === 0 && !isRecording && (
              <div className="flex flex-col items-center justify-center h-full pt-10 md:pt-20 text-center">
                 <Phone className="w-16 h-16 md:w-20 md:h-20 text-primary mb-6" />
                 <h2 className="text-xl md:text-2xl font-semibold">Ready to talk?</h2>
                 <p className="text-muted-foreground mt-2 max-w-xs sm:max-w-sm">Press the microphone button below to start the conversation.</p>
              </div>
            )}
            {messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.sender === 'ai' && (
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 border">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-4 h-4 md:w-5 md:h-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('max-w-[80%] rounded-xl px-4 py-3 text-sm md:text-base shadow-sm md:max-w-md lg:max-w-lg', message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background text-card-foreground rounded-bl-none border')}>
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
            ))}
             {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 border"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-4 h-4 md:w-5 md:h-5"/></AvatarFallback></Avatar>
                    <div className="bg-background text-card-foreground rounded-xl px-4 py-3 shadow-sm rounded-bl-none border flex items-center text-sm md:text-base">
                      <Loader2 className="w-5 h-5 animate-spin mr-2"/> Thinking...
                    </div>
               </div>
            )}
          </div>
        </ScrollArea>
        <div className="mt-auto p-4 flex flex-col items-center justify-center gap-4">
            <Card className="w-full max-w-xl h-24">
                <CardContent className="p-4 h-full">
                    <p className="text-sm text-muted-foreground italic">
                        {isRecording ? transcript || 'Listening...' : messages.length === 0 ? 'Press the mic to speak.' : 'Press the mic to reply.'}
                    </p>
                </CardContent>
            </Card>
            <Button
                size="lg"
                variant={isRecording ? 'destructive' : 'default'}
                className="rounded-full w-20 h-20 shadow-lg"
                onClick={handleMicClick}
                disabled={isLoading}
            >
                {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>
            <p className="text-sm text-muted-foreground">
                {isRecording ? 'Listening for you to speak...' : 'Press to talk'}
            </p>
        </div>
      </main>
    </div>
  );
}

    