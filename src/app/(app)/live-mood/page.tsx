
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Square, Bot, Camera, User } from 'lucide-react';
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

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export default function LiveMoodPage() {
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const transcriptRef = useRef(''); // Ref to hold the latest transcript
    const { toast } = useToast();
    const { user } = useAuth();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    }, [toast]);

    useEffect(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chatMessages]);
    
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (recognitionRef.current) recognitionRef.current.stop();
      }
    }, []);

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
    
    const processMood = async (transcript: string) => {
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
            const result = await predictLiveMood({
                photoDataUri,
                description: transcript
            });

            const aiMessage: ChatMessage = { sender: 'ai', text: result.response };
            setChatMessages(prev => [...prev, aiMessage]);
            
            const ttsResult = await textToSpeech({ text: result.response });
            if (ttsResult.audioDataUri) {
                const audio = new Audio(ttsResult.audioDataUri);
                audio.play();
            }

        } catch (error) {
            console.error('Error predicting live mood:', error);
            toast({ title: 'AI Analysis Failed', variant: 'destructive' });
            const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I couldn't process that right now." };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
            setIsRecording(false);
            
            const finalTranscript = transcriptRef.current.trim();
            if (finalTranscript) {
                processMood(finalTranscript);
            }
            transcriptRef.current = '';
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const startListening = () => {
        if (!SpeechRecognition) {
            toast({ title: 'Speech Recognition not supported', variant: 'destructive' });
            return;
        }

        setIsRecording(true);
        transcriptRef.current = '';
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            transcriptRef.current = finalTranscript + interimTranscript;

            silenceTimeoutRef.current = setTimeout(() => {
                stopListening();
            }, 2000);
        };

        recognitionRef.current.onend = () => {
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            if (recognitionRef.current) {
                stopListening();
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            toast({ title: 'Speech recognition error', description: event.error, variant: 'destructive' });
            setIsRecording(false);
        };

        recognitionRef.current.start();
    };

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
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" />
                                Your Camera
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-center justify-center">
                            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
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
                    <div className="text-center">
                        <Button
                            onClick={handleMicClick}
                            disabled={hasCameraPermission !== true || isProcessing}
                            size="lg"
                            variant={isRecording ? 'destructive' : 'default'}
                            className="rounded-full w-24 h-24 shadow-lg"
                        >
                            {isRecording ? <Square className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isRecording ? 'Listening...' : 'Tap to Speak'}
                        </p>
                    </div>
                </div>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Live Interaction</CardTitle>
                        <CardDescription>Your conversation with the AI will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col overflow-hidden">
                         <ScrollArea className="flex-1 h-full" ref={scrollAreaRef}>
                            <div className="p-4 space-y-4">
                                {chatMessages.length === 0 && !isProcessing && (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
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
                                {isProcessing && (
                                     <div className="flex items-start gap-3 justify-start">
                                        <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                        <div className="bg-muted rounded-xl px-4 py-3 text-sm shadow-sm flex items-center">
                                            <Loader2 className="w-4 h-4 animate-spin mr-2"/> Thinking...
                                        </div>
                                     </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
}
