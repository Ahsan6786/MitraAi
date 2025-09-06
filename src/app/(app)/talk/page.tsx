
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, Bot, Languages, Phone } from 'lucide-react';
import { chatEmpatheticTone } from '@/ai/flows/chat-empathetic-tone';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';


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

function TalkPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [language, setLanguage] = useState('English');
  
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleAiResponse = async (messageText: string) => {
    if (!messageText.trim()) return;
    setIsLoading(true);
    setAiResponse('');

    try {
      const crisisResult = await detectCrisis({ message: messageText });
      if (crisisResult.isCrisis) {
        setShowCrisisModal(true);
        setIsLoading(false);
        return;
      }
      
      const result = await chatEmpatheticTone({ message: messageText, language: language });
      setAiResponse(result.response);
      
      if (result.response.trim()) {
        const ttsResult = await textToSpeech({ text: result.response });
        if (ttsResult.audioDataUri) {
            const audio = new Audio(ttsResult.audioDataUri);
            audioRef.current = audio;
            audio.play().catch(e => console.error("Error playing audio:", e));
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (transcript.trim()) {
        handleAiResponse(transcript);
    }
  }, [transcript, language]); // Added language dependency

  const startRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsRecording(true);
    setTranscript('');
    setAiResponse('');
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = languages.find(l => l.value === language)?.speechCode || 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
      }
      setTranscript(interimTranscript);
    };
    
    recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
            title: "Voice Error",
            description: "Could not start voice recognition. Please check your microphone permissions.",
            variant: "destructive",
        });
        setIsRecording(false);
    };
    
    recognitionRef.current.onend = () => {
      setIsRecording(false);
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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  const getStatusText = () => {
      if (isRecording) return "Listening... Tap to stop.";
      if (isLoading) return "Mitra is thinking...";
      if (aiResponse) return "Tap the microphone to reply.";
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
              <p className="text-sm text-muted-foreground">Have a live voice conversation.</p>
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
            <GenZToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-full max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Talk to your AI companion</h2>
                <p className="text-muted-foreground text-lg mt-2 mb-12">
                    Speak your mind and get instant support. Our AI is here to listen and help you navigate your emotions.
                </p>
                <div className="flex flex-col items-center justify-center gap-8">
                    <Button 
                        className={cn(
                            "relative rounded-full h-40 w-40 bg-primary text-primary-foreground shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50",
                            isRecording && "scale-105"
                        )}
                        onClick={handleMicClick}
                        disabled={isLoading}
                    >
                        {isRecording ? <Square className="text-7xl" /> : <Mic className="text-7xl" />}
                        {isRecording && <div className="absolute inset-0 rounded-full border-4 border-transparent animate-pulse-border"></div>}
                    </Button>
                    <p className="text-muted-foreground text-base h-5">{getStatusText()}</p>
                </div>

                <div className={cn("mt-12 text-left transition-opacity duration-500", (transcript || aiResponse || isLoading) ? "opacity-100" : "opacity-0")}>
                    {transcript && (
                        <Card className="bg-muted border-none mb-4">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">You said:</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground italic">"{transcript}"</p>
                            </CardContent>
                        </Card>
                    )}
                    {(aiResponse || isLoading) && (
                        <Card className="bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-primary" />
                                    Mitra replied:
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                ) : (
                                    <p className="text-foreground">{aiResponse}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
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
