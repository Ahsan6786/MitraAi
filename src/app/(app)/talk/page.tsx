
'use client';

import { useState, useRef, useEffect } from 'react';
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

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export default function TalkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('English');
  const [transcript, setTranscript] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleAiResponse = async (messageText: string) => {
    const userMessage: Message = { sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chatEmpatheticTone({ message: messageText, language });
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

  const startRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsRecording(true);
    setTranscript('');
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US'; 

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
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
    
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
        if (transcript.trim()) {
            handleAiResponse(transcript);
        }
        setTranscript('');
    }
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

  return (
    <div className="h-full flex flex-col bg-muted/20">
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
                </SelectContent>
            </Select>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-2 sm:p-4 md:p-6 flex flex-col">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-2 md:p-4 space-y-6">
            {messages.length === 0 && (
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
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 border"><AvatarFallback><User className="w-4 h-4 md:w-5 md:h-5"/></AvatarFallback></Avatar>
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
                        {isRecording ? transcript || 'Listening...' : 'Press the mic to speak.'}
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
                {isRecording ? 'Press to stop' : 'Press to talk'}
            </p>
        </div>
      </main>
    </div>
  );
}
