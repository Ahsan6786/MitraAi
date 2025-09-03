
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { predictLiveMood } from '@/ai/flows/predict-live-mood';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

const languageToSpeechCode: Record<string, string> = {
    English: 'en-US',
    Hindi: 'hi-IN',
    Hinglish: 'en-IN',
};

export default function AvatarPage() {
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState('English');
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [statusText, setStatusText] = useState('Tap the microphone to start talking.');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { toast } = useToast();
    
    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setHasCameraPermission(false);
                toast({ variant: 'destructive', title: 'Media Devices Not Supported' });
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing media devices:', error);
                setHasCameraPermission(false);
                toast({ variant: 'destructive', title: 'Permissions Denied', description: 'Please enable camera and microphone permissions.' });
            }
        };
        getCameraPermission();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort();
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

    const processInteraction = useCallback(async (transcript: string) => {
        if (!transcript.trim()) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        setStatusText('Mitra is thinking...');
        const photoDataUri = captureFrame();

        if (!photoDataUri) {
            toast({ title: 'Could not capture frame', variant: 'destructive' });
            setIsProcessing(false);
            return;
        }

        try {
            const crisisResult = await detectCrisis({ message: transcript });
            if (crisisResult.isCrisis) {
              setShowCrisisModal(true);
              setIsProcessing(false);
              setStatusText('Tap the microphone to start talking.');
              return;
            }

            const moodResult = await predictLiveMood({ photoDataUri, description: transcript, language });
            const ttsResult = await textToSpeech({ text: moodResult.response });
            
            if (ttsResult.audioDataUri) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                const audio = new Audio(ttsResult.audioDataUri);
                audioRef.current = audio;

                setIsSpeaking(true);
                audio.play();
                audio.onended = () => {
                   setIsSpeaking(false);
                };
            }

        } catch (error) {
            console.error('Error in processing interaction:', error);
            toast({ title: 'AI Interaction Failed', variant: 'destructive' });
        } finally {
             setIsProcessing(false);
             setStatusText('Tap the microphone to reply.');
        }
    }, [language, toast]);
    
    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            toast({ title: 'Browser Not Supported', variant: 'destructive' });
            return;
        }
        if (isRecording || isProcessing) return;

        setIsRecording(true);
        setStatusText('Listening...');
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsSpeaking(false);

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = languageToSpeechCode[language] || 'en-US';
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            processInteraction(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
            if (!isProcessing) {
                setStatusText('Tap the microphone to start talking.');
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                toast({ title: 'Speech recognition error', variant: 'destructive' });
            }
            setIsRecording(false);
        };
        
        recognition.start();
    }, [isRecording, isProcessing, language, toast, processInteraction]);

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
        <>
        <style jsx global>{`
            @keyframes pulse-avatar {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 0 10px hsl(var(--primary) / 0);
                }
            }
            .animate-pulse-avatar {
                animation: pulse-avatar 2s infinite;
            }
        `}</style>
        <CrisisAlertModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Mitra Avatar</h1>
                        <p className="text-sm text-muted-foreground">Have a face-to-face chat with your AI companion.</p>
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

            <main className="flex-1 flex flex-col items-center justify-center relative p-4">
                 <div className="absolute top-4 right-4 z-10 w-32 h-24 sm:w-48 sm:h-36 rounded-md overflow-hidden border-2 border-border shadow-lg">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center p-2 bg-black/50">
                            <p className="text-xs text-white text-center">Enable camera to use this feature.</p>
                        </div>
                    )}
                 </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <div className={cn("relative w-48 h-48 sm:w-64 sm:h-64 rounded-full transition-all", isSpeaking && "animate-pulse-avatar")}>
                       <Image
                         src="https://api.dicebear.com/9.x/adventurer/svg?seed=Brian"
                         alt="avatar"
                         layout="fill"
                         className="rounded-full dark:invert"
                       />
                    </div>
                </div>
                
                <footer className="p-4 text-center bg-transparent">
                    <Button
                        onClick={handleMicClick}
                        disabled={hasCameraPermission !== true || isProcessing}
                        size="lg"
                        variant={isRecording ? 'destructive' : 'default'}
                        className="rounded-full w-20 h-20 sm:w-24 sm:h-24 shadow-lg"
                    >
                        {isProcessing ? <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" /> : (isRecording ? <Square className="w-8 h-8 sm:w-10 sm:h-10" /> : <Mic className="w-8 h-8 sm:w-10 sm:h-10" />)}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2 h-5">
                        {statusText}
                    </p>
                </footer>
            </main>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        </>
    );
}
