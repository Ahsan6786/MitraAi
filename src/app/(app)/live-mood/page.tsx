
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Square, Bot, Camera, User, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { predictLiveMood } from '@/ai/flows/predict-live-mood';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

const languageToSpeechCode: Record<string, string> = {
    English: 'en-US',
    Hindi: 'hi-IN',
    Hinglish: 'en-IN',
};

export default function LiveMoodPage() {
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [language, setLanguage] = useState('English');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chatMessages]);
    
    // Setup and cleanup camera
    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Media Devices Not Supported',
                    description: 'Your browser does not support camera access.',
                });
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions to use this feature.',
                });
            }
        };
        getCameraPermission();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, [toast]);


    const captureFrame = (): string => {
        if (!videoRef.current || !canvasRef.current) return '';
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg');
        }
        return '';
    };

    const processMood = useCallback(async (transcript: string) => {
        if (!transcript.trim()) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        const photoDataUri = captureFrame();
        const userMessage: ChatMessage = { sender: 'user', text: transcript };
        setChatMessages(prev => [...prev, userMessage]);

        if (!photoDataUri) {
            toast({ title: 'Could not capture frame', variant: 'destructive' });
            setIsProcessing(false);
            return;
        }

        try {
            const result = await predictLiveMood({ photoDataUri, description: transcript, language });
            const aiMessage: ChatMessage = { sender: 'ai', text: result.response };
            setChatMessages(prev => [...prev, aiMessage]);
            
            const handleAudioEnd = () => {
                setIsProcessing(false);
                // After AI finishes speaking, wait 0.5s and then listen again.
                // We call startListening via a ref to avoid circular dependencies.
                setTimeout(() => {
                    startListeningRef.current?.();
                }, 500);
            };

            if (result.response.trim()) {
                const ttsResult = await textToSpeech({ text: result.response });
                if (ttsResult.audioDataUri) {
                    const audio = new Audio(ttsResult.audioDataUri);
                    audioRef.current = audio;
                    audio.onended = handleAudioEnd;
                    audio.play();
                } else {
                    handleAudioEnd(); // If TTS fails, still proceed to listen again.
                }
            } else {
                 handleAudioEnd(); // If AI gives no response, listen again.
            }

        } catch (error) {
            console.error('Error predicting live mood:', error);
            toast({ title: 'AI Analysis Failed', variant: 'destructive' });
            const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I couldn't process that right now." };
            setChatMessages(prev => [...prev, errorMessage]);
            setIsProcessing(false);
        }
    }, [language, toast]);
    
    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            toast({ title: 'Browser Not Supported', variant: 'destructive' });
            return;
        }
        if (isRecording || isProcessing) return;

        setIsRecording(true);
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = false; // Process after a single utterance
        recognition.interimResults = false;
        recognition.lang = languageToSpeechCode[language] || 'en-US';
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            processMood(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                toast({ title: 'Speech recognition error', description: `Error: ${event.error}`, variant: 'destructive' });
            }
            setIsRecording(false);
        };
        
        recognition.start();
    }, [isRecording, isProcessing, language, toast, processMood]);

    // Use a ref to hold the startListening function to break circular dependency
    const startListeningRef = useRef(startListening);
    useEffect(() => {
        startListeningRef.current = startListening;
    }, [startListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            setIsRecording(false);
        }
    }, []);

    const handleMicClick = () => {
        if (isRecording) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Live Mood Analysis</h1>
                        <p className="text-sm text-muted-foreground">Interact with an AI that sees and hears you.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={language} onValueChange={setLanguage} disabled={isRecording || isProcessing}>
                        <SelectTrigger className="w-[120px]">
                            <Languages className="w-4 h-4 mr-2"/>
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Hinglish">Hinglish</SelectItem>
                        </SelectContent>
                    </Select>
                    <ThemeToggle />
                </div>
            </header>

             <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Side: Camera View */}
                <div className="w-full md:w-1/2 p-2 sm:p-4 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" />
                                Your Camera
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-center justify-center p-2 sm:p-4 md:p-6">
                            <div className="relative w-full max-w-md aspect-video bg-muted rounded-md overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                {hasCameraPermission === false && (
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <Alert variant="destructive">
                                            <AlertTitle>Camera Access Required</AlertTitle>
                                            <AlertDescription>
                                                Please allow camera access in your browser to use this feature.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Side: Chat and Controls */}
                <div className="flex-1 flex flex-col overflow-hidden">
                     <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
                        <div className="p-2 sm:p-4 md:p-6 space-y-4">
                            {chatMessages.length === 0 && !isProcessing && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                    <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">The AI is waiting for you to speak.</p>
                                </div>
                            )}
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                    {msg.sender === 'ai' && <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                                    <p className={cn('max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm', msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        {msg.text}
                                    </p>
                                    {msg.sender === 'user' && <Avatar><AvatarFallback>{user?.email?.[0].toUpperCase() ?? <User />}</AvatarFallback></Avatar>}
                                </div>
                            ))}
                            {isProcessing && chatMessages[chatMessages.length - 1]?.sender === 'user' && (
                                <div className="flex items-start gap-3 justify-start">
                                    <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                    <div className="bg-muted rounded-xl px-4 py-3 text-sm shadow-sm flex items-center">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2"/> Thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <footer className="border-t p-4 text-center bg-background">
                        <Button
                            onClick={handleMicClick}
                            disabled={hasCameraPermission !== true || isProcessing}
                            size="lg"
                            variant={isRecording ? 'destructive' : 'default'}
                            className="rounded-full w-20 h-20 sm:w-24 sm:h-24 shadow-lg"
                        >
                            {isRecording ? <Square className="w-8 h-8 sm:w-10 sm:h-10" /> : <Mic className="w-8 h-8 sm:w-10 sm:h-10" />}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isRecording ? 'Listening...' : (isProcessing ? 'Processing...' : 'Tap to Speak')}
                        </p>
                    </footer>
                </div>
            </main>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
}
