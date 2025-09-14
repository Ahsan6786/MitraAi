
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, Bot, Languages, Phone, User } from 'lucide-react';
import { chatEmpatheticTone } from '@/ai/flows/chat-empathetic-tone';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';


const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

const languages = [
    { value: 'English', label: 'English', speechCode: 'en-US' },
    { value: 'Hinglish', label: 'Hinglish', speechCode: 'en-IN' },
    { value: 'Hindi', label: 'Hindi', speechCode: 'hi-IN' },
    { value: 'Bengali', label: 'Bengali', speechCode: 'bn-IN' },
    { value: 'Gujarati', label: 'Gujarati', speechCode: 'gu-IN' },
    { value: 'Kannada', label: 'Kannada', speechCode: 'kn-IN' },
    { value: 'Malayalam', label: 'Malayalam', speechCode: 'ml-IN' },
    { value: 'Marathi', label: 'Marathi', speechCode: 'mr-IN' },
    { value: 'Tamil', label: 'Tamil', speechCode: 'ta-IN' },
    { value: 'Telugu', label: 'Telugu', speechCode: 'te-IN' },
    { value: 'Urdu', label: 'Urdu', speechCode: 'ur-IN' },
    { value: 'Sanskrit', label: 'Sanskrit' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Assamese', label: 'Assamese' },
    { value: 'Bodo', label: 'Bodo' },
    { value: 'Konkani', label: 'Konkani' },
    { value: 'Meitei', label: 'Meitei' },
    { value: 'Mizo', label: 'Mizo' },
    { value: 'Odia', label: 'Odia' },
    { value: 'Punjabi', label: 'Punjabi' },
    { value: 'Nepali', label: 'Nepali' },
    { value: 'Sikkimese', label: 'Sikkimese' },
    { value: 'Lepcha', label: 'Lepcha' },
    { value: 'Limbu', label: 'Limbu' },
    { value: 'Kokborok', label: 'Kokborok' },
    { value: 'Bhojpuri', label: 'Bhojpuri' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
];

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const TOKEN_COST = 10;

function TalkPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [language, setLanguage] = useState('English');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleAiResponse = async (messageText: string) => {
    if (!messageText.trim() || !user) {
        setIsLoading(false);
        return;
    };

    setChatHistory(prev => [...prev, { sender: 'user', text: messageText }]);
    setIsLoading(true);

    const userDocRef = doc(db, 'users', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw "User document does not exist!";
        
        const currentTokens = userDoc.data().tokens || 0;
        if (currentTokens < TOKEN_COST) throw new Error("Insufficient tokens.");

        transaction.update(userDocRef, { tokens: increment(-TOKEN_COST) });
      });

      const crisisResult = await detectCrisis({ message: messageText });
      if (crisisResult.isCrisis) {
        setShowCrisisModal(true);
        setIsLoading(false);
        return;
      }
      
      const result = await chatEmpatheticTone({ message: messageText, language: language });
      setChatHistory(prev => [...prev, { sender: 'ai', text: result.response }]);
      toast({ title: `${TOKEN_COST} tokens used.`});

      if (result.response.trim()) {
        const ttsResult = await textToSpeech({ text: result.response });
        if (ttsResult.audioDataUri) {
            const audio = new Audio(ttsResult.audioDataUri);
            audioRef.current = audio;
            audio.play().catch(e => console.error("Error playing audio:", e));
        }
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorMessageText = "Sorry, I encountered an error. Please try again.";
      setChatHistory(prev => [...prev, { sender: 'ai', text: errorMessageText }]);
      
      if (error.message.includes("Insufficient tokens")) {
        toast({
            title: "Insufficient Tokens",
            description: "Please ask your doctor for a recharge.",
            variant: "destructive",
            action: <ToastAction altText="Message Doctor" onClick={() => router.push('/reports')}>Message Doctor</ToastAction>,
        });
      } else {
        toast({ title: "Error", description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend will handle the rest
    }
  }, []);

  const startRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsRecording(true);
    finalTranscriptRef.current = ""; // Reset transcript
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languages.find(l => l.value === language)?.speechCode || 'en-US';

    recognition.onresult = (event: any) => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

      let interimTranscript = '';
      let currentFinalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current = currentFinalTranscript;

      pauseTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 1500);
    };
    
    recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast({
                title: "Voice Error",
                description: `Could not start voice recognition: ${event.error}`,
                variant: "destructive",
            });
        }
        setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      recognitionRef.current = null;
      
      // Use the final transcript we've been building
      const finalTranscript = finalTranscriptRef.current;
      if(finalTranscript) {
          handleAiResponse(finalTranscript);
      }
    }

    recognition.start();
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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);
  
  const getStatusText = () => {
      if (isRecording) return "Listening... I'll send when you pause.";
      if (isLoading) return "Mitra is thinking...";
      if (chatHistory.length > 0) return "Tap the microphone to reply.";
      return "Tap the microphone to start talking.";
  }

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7);
          }
          50% {
            box-shadow: 0 0 0 20px hsl(var(--primary) / 0);
          }
        }
        .animate-pulse-border {
          animation: pulse-border 2s infinite;
        }
      `}</style>
      <div className="h-full flex flex-col">
        <CrisisAlertModal
          isOpen={showCrisisModal}
          onClose={() => setShowCrisisModal(false)}
        />
        <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg md:text-xl font-bold">Talk to Mitra</h1>
              <p className="text-sm text-muted-foreground">Each interaction costs ${TOKEN_COST} tokens.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Select value={language} onValueChange={setLanguage} disabled={isRecording || isLoading}>
                <SelectTrigger className="w-auto">
                    <Languages className="w-4 h-4 mr-2"/>
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled>
                            <User />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Custom voice is a feature coming soon!</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <GenZToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-between p-4 text-center">
            <ScrollArea className="w-full max-w-2xl flex-1" viewportRef={scrollViewportRef}>
                <div className="space-y-4 py-4">
                    {chatHistory.length === 0 && (
                        <div className="text-center py-10">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Talk to your AI companion</h2>
                            <p className="text-muted-foreground text-lg mt-2">
                                Speak your mind and get instant support. Our AI is here to listen and help you navigate your emotions.
                            </p>
                        </div>
                    )}
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.sender === 'ai' && <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                            <p className={cn('max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm text-left', msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                {msg.text}
                            </p>
                            {msg.sender === 'user' && <Avatar><AvatarFallback>{user?.email?.[0].toUpperCase() ?? <User />}</AvatarFallback></Avatar>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                            <div className="bg-muted rounded-xl px-4 py-3 text-sm shadow-sm flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin mr-2"/> Thinking...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="w-full max-w-2xl py-4">
                <div className="flex flex-col items-center justify-center gap-4">
                    <Button 
                        className={cn(
                            "relative rounded-full h-28 w-28 bg-primary text-primary-foreground shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50",
                            isRecording && "scale-105"
                        )}
                        onClick={handleMicClick}
                        disabled={isLoading}
                    >
                        {isRecording ? <Square className="text-5xl" /> : <Mic className="text-5xl" />}
                        {isRecording && <div className="absolute inset-0 rounded-full border-4 border-transparent animate-pulse-border"></div>}
                    </Button>
                    <p className="text-muted-foreground text-base h-5">{getStatusText()}</p>
                </div>
            </div>
        </main>
      </div>
    </>
  );
}

export default function TalkPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenTalkIntro';

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
            icon={<Phone className="w-full h-full" />}
            title="Talk to Mitra"
            subtitle="Have a live voice conversation."
        />;
    }

    return <TalkPageContent />;
}

    