
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, Play, Trash2, Wand2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cloneVoice } from '@/ai/flows/clone-voice';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const recordingSentences = [
    "I'm creating a custom voice for my AI companion, Mitra.",
    "The quick brown fox jumps over the lazy dog.",
    "The human voice is the most perfect instrument of all.",
    "Technology has the power to connect us in new and meaningful ways."
];

export default function VoiceLabPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customVoiceId, setCustomVoiceId] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setCustomVoiceId(doc.data().customVoiceId || null);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop()); // Stop the mic
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioBlob(null);
            setAudioUrl(null);
        } catch (error) {
            console.error("Error starting recording:", error);
            toast({ title: "Microphone Error", description: "Could not access your microphone. Please check permissions.", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    
    const resetRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
    }
    
    const handleCreateVoice = async () => {
        if (!audioBlob || !user) return;
        setIsSubmitting(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                await cloneVoice({
                    audioDataUri: base64data,
                    userId: user.uid,
                    userName: user.displayName || 'User',
                });
                toast({
                    title: "Voice Cloned Successfully!",
                    description: "Your custom voice is now ready to be used in 'Talk to Mitra'."
                });
                resetRecording();
            };
        } catch (error: any) {
            console.error("Error cloning voice:", error);
            toast({ title: "Cloning Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Voice Lab</h1>
                        <p className="text-sm text-muted-foreground">Create a custom voice for MitraAI.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12 flex justify-center items-start">
                 <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Wand2 className="w-6 h-6 text-primary"/>
                           Your Custom Voice
                        </CardTitle>
                        <CardDescription>
                            Record a short audio sample of your voice. We'll use it to create a personalized voice for your AI companion.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Subscription Required</AlertTitle>
                            <AlertDescription>
                                The ElevenLabs API requires a paid subscription to use the voice cloning feature. This page will not work correctly on their free plan.
                            </AlertDescription>
                        </Alert>
                        {customVoiceId ? (
                             <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">Your custom voice is ready!</h3>
                                <p className="text-muted-foreground mt-1">You can now use your personalized voice in the "Talk to Mitra" feature.</p>
                                <Button asChild className="mt-4">
                                    <Link href="/talk">Try it now</Link>
                                </Button>
                            </div>
                        ) : (
                        <>
                            <div className="p-4 border-dashed border-2 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2">Recording Script</h4>
                                <p className="text-muted-foreground">For best results, read the following sentences clearly and naturally:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {recordingSentences.map((sentence, i) => <li key={i}>{sentence}</li>)}
                                </ul>
                            </div>
                            
                            <div className="text-center">
                                {isRecording ? (
                                    <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full h-20 w-20 shadow-lg">
                                        <Square className="w-8 h-8"/>
                                    </Button>
                                ) : (
                                    <Button onClick={startRecording} size="lg" className="rounded-full h-20 w-20 shadow-lg" disabled={isSubmitting}>
                                        <Mic className="w-8 h-8"/>
                                    </Button>
                                )}
                                <p className="text-sm text-muted-foreground mt-2">{isRecording ? "Recording..." : "Tap to record"}</p>
                            </div>

                            {audioUrl && (
                                <div className="p-4 bg-muted rounded-lg flex items-center justify-between animate-in fade-in-50">
                                    <div className="flex items-center gap-4">
                                        <audio src={audioUrl} controls />
                                    </div>
                                    <Button onClick={resetRecording} variant="ghost" size="icon">
                                        <Trash2 className="w-4 h-4 text-destructive"/>
                                    </Button>
                                </div>
                            )}

                             <div className="flex items-start gap-3 rounded-md border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600"/>
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    <strong>Important:</strong> By creating a custom voice, you consent to your voice data being processed by third-party services for this purpose.
                                </p>
                            </div>

                            <Button onClick={handleCreateVoice} disabled={!audioBlob || isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                                {isSubmitting ? 'Creating Voice...' : 'Create My Voice'}
                            </Button>
                        </>
                        )}
                    </CardContent>
                 </Card>
            </main>
        </div>
    );
}
