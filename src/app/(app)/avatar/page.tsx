
'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, Bot, Camera, User, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { predictLiveMood } from '@/ai/flows/predict-live-mood';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Avatar } from '@/components/avatar';

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
    const [language, setLanguage] = useState('English');
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('Tap the microphone to start talking.');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
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
                setAudioUrl(ttsResult.audioDataUri);
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
        setAudioUrl(null);
        setStatusText('Listening...');

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

            <main className="flex-1 flex flex-col relative">
                 <div className="absolute top-4 right-4 z-10 w-32 h-24 sm:w-48 sm:h-36 rounded-md overflow-hidden border-2 border-border shadow-lg">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center p-2 bg-black/50">
                            <p className="text-xs text-white text-center">Enable camera to use this feature.</p>
                        </div>
                    )}
                 </div>

                <div className="flex-1">
                   <Canvas camera={{ position: [0, 0, 2.5], fov: 25 }}>
                       <Suspense fallback={null}>
                            <Environment preset="sunset" />
                            <Avatar audioUrl={audioUrl} />
                       </Suspense>
                   </Canvas>
                </div>
                
                <footer className="border-t p-4 text-center bg-background/80 backdrop-blur-sm">
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
