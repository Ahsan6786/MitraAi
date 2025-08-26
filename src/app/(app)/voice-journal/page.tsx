
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loader2, Mic, Square, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { predictUserMood } from '@/ai/flows/predict-user-mood';
import { generateSuggestions } from '@/ai/flows/generate-suggestions';

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'analyzing' | 'finished';

const mimeType = 'audio/webm';

export default function VoiceJournalPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [permission, setPermission] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const [recordingStatus, setRecordingStatus] = useState<RecordingState>('idle');
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    
    const [transcription, setTranscription] = useState('');
    const [mood, setMood] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);


    const getMicrophonePermission = async () => {
        if ("MediaRecorder" in window) {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                setPermission(true);
                setStream(streamData);
            } catch (err: any) {
                alert(err.message);
            }
        } else {
            alert("The MediaRecorder API is not supported in your browser.");
        }
    };

    useEffect(() => {
        getMicrophonePermission();
    }, []);

    const startRecording = () => {
        if (stream === null) return;
        setRecordingStatus("recording");
        const media = new MediaRecorder(stream, { mimeType });
        mediaRecorder.current = media;
        mediaRecorder.current.start();
        let localAudioChunks: Blob[] = [];
        mediaRecorder.current.ondataavailable = (event) => {
            if (typeof event.data === "undefined") return;
            if (event.data.size === 0) return;
            localAudioChunks.push(event.data);
        };
        setAudioChunks(localAudioChunks);
    };

    const stopRecording = () => {
        if (mediaRecorder.current === null) return;
        
        mediaRecorder.current.stop();
        mediaRecorder.current.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                if(base64Audio) {
                    await processAudio(base64Audio);
                }
            };

            setAudioChunks([]);
        };
    };

    const processAudio = async (audioDataUri: string) => {
        if (!user) {
            toast({ title: "Not authenticated", variant: "destructive" });
            return;
        }

        try {
            // 1. Transcribe
            setRecordingStatus('transcribing');
            const transcriptionResult = await transcribeAudio({ audioDataUri });
            const transcriptText = transcriptionResult.transcription;
            setTranscription(transcriptText);

            // Handle empty transcription
            if (!transcriptText.trim()) {
                toast({ title: "No speech detected", description: "Couldn't detect any speech in the recording. Please try again.", variant: 'destructive' });
                resetState();
                return;
            }

            // 2. Analyze Mood
            setRecordingStatus('analyzing');
            const moodResult = await predictUserMood({ journalEntry: transcriptText });
            setMood(moodResult.mood);
            
            // 3. Generate Suggestions
            const suggestionsResult = await generateSuggestions({ mood: moodResult.mood });
            setSuggestions(suggestionsResult.suggestions);

            // 4. Save to Firestore (without querying, to avoid index issues)
            await addDoc(collection(db, 'journalEntries'), {
                userId: user.uid,
                userEmail: user.email,
                type: 'voice',
                transcription: transcriptText,
                mood: moodResult.mood,
                confidence: moodResult.confidence,
                createdAt: serverTimestamp(),
                reviewed: false,
                doctorReport: null,
            });

            setRecordingStatus('finished');
            toast({ title: "Voice entry saved!", description: "Your voice journal has been analyzed and saved." });

        } catch (error) {
            console.error("Error processing audio entry:", error);
            toast({ title: "Error", description: "Failed to process your voice entry.", variant: "destructive" });
            resetState();
        }
    };
    
    const resetState = () => {
        setRecordingStatus('idle');
        setTranscription('');
        setMood('');
        setSuggestions([]);
    }

    const isLoading = recordingStatus === 'transcribing' || recordingStatus === 'analyzing';

    const renderStatus = () => {
        switch (recordingStatus) {
            case 'recording': return <div className="text-destructive font-semibold flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>Recording...</div>;
            case 'transcribing': return <div className="text-primary font-semibold flex items-center gap-2"><Loader2 className="animate-spin" /> Transcribing audio...</div>;
            case 'analyzing': return <div className="text-primary font-semibold flex items-center gap-2"><Loader2 className="animate-spin" /> Analyzing mood...</div>;
            case 'finished': return <div className="text-green-600 font-semibold flex items-center gap-2"><CheckCircle /> Analysis Complete</div>;
            default: return <p className="text-muted-foreground">Press the button to start recording your thoughts.</p>;
        }
    }


    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Voice Journal</h1>
                        <p className="text-sm text-muted-foreground">Speak your mind, let us analyze.</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
                <div className="w-full max-w-2xl space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle>Voice Reflection</CardTitle>
                            <CardDescription>
                                {renderStatus()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
                           <Button
                                size="lg"
                                className="w-24 h-24 rounded-full shadow-lg"
                                onClick={recordingStatus === 'recording' ? stopRecording : startRecording}
                                disabled={!permission || isLoading}
                                variant={recordingStatus === 'recording' ? 'destructive' : 'default'}
                           >
                            {isLoading ? (
                                <Loader2 className="w-10 h-10 animate-spin" />
                            ) : recordingStatus === 'recording' ? (
                                <Square className="w-10 h-10" />
                            ) : (
                                <Mic className="w-10 h-10" />
                            )}
                           </Button>
                        </CardContent>
                         {recordingStatus === 'finished' && (
                            <CardFooter>
                                <Button onClick={resetState} className="w-full">Start New Entry</Button>
                            </CardFooter>
                        )}
                    </Card>

                    {recordingStatus === 'finished' && (
                        <Card className="animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle>Analysis Results</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Your Transcription:</h3>
                                    <p className="text-muted-foreground italic p-3 bg-muted rounded-md mt-1">"{transcription}"</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Detected Mood:</h3>
                                    <p className="text-primary font-bold capitalize text-lg p-2">{mood}</p>
                                </div>
                                <div>
                                     <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Suggestions:</h3>
                                     <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                                        {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                     </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
