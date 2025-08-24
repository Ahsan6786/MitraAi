
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeVoiceJournal, AnalyzeVoiceJournalOutput } from '@/ai/flows/analyze-voice-journal';
import { Loader2, Mic, Square, Trash2, Lightbulb, ListChecks, Quote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMusic } from '@/hooks/use-music';


type RecordingStatus = 'idle' | 'recording' | 'stopped';

export default function VoiceJournalPage() {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeVoiceJournalOutput | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { pauseMusic, resumeMusic } = useMusic();

  const startRecording = async () => {
    try {
      pauseMusic();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = { mimeType: 'audio/webm' };
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } else {
        console.warn(`${options.mimeType} is not supported, using browser default.`);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        resumeMusic();
      };

      mediaRecorderRef.current.start();
      setRecordingStatus('recording');
      setAnalysisResult(null);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
      resumeMusic();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingStatus('stopped');
    }
  };

  const resetRecording = () => {
    setRecordingStatus('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setAnalysisResult(null);
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  const handleAnalyze = async () => {
    if (!audioBlob) return;
     if (!user) {
        toast({
            title: "Not Authenticated",
            description: "You must be logged in to save an entry.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
        const base64Audio = await convertBlobToBase64(audioBlob);
        const analysis = await analyzeVoiceJournal({ audioDataUri: base64Audio });
        
        const audioFileName = `voice-journals/${user.uid}/${Date.now()}.webm`;
        const storageRef = ref(storage, audioFileName);
        await uploadBytes(storageRef, audioBlob);
        const downloadURL = await getDownloadURL(storageRef);
        
        await addDoc(collection(db, 'journalEntries'), {
            userId: user.uid,
            userEmail: user.email,
            type: 'voice',
            mood: analysis.mood,
            transcription: analysis.transcription,
            solutions: analysis.solutions,
            audioUrl: downloadURL,
            createdAt: serverTimestamp(),
            reviewed: false,
            doctorReport: null,
        });

        setAnalysisResult(analysis);
        toast({
            title: "Analysis Complete & Saved",
            description: "Your voice journal has been successfully saved.",
        });

    } catch (error) {
        console.error('Error during analysis or save:', error);
        toast({
            title: 'Analysis Failed',
            description: 'Sorry, we could not process your audio right now. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <header className="border-b bg-background p-3 md:p-4 flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <div>
          <h1 className="text-lg md:text-xl font-bold">Voice Journal</h1>
          <p className="text-sm text-muted-foreground">Speak your mind, discover your mood.</p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Record Your Thoughts</CardTitle>
            <CardDescription>Press the microphone to start recording. Speak freely about your day or how you're feeling.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
            {recordingStatus === 'recording' && (
               <div className="text-primary flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span>Recording...</span>
              </div>
            )}
            
            {recordingStatus === 'idle' && (
              <Button onClick={startRecording} size="lg" className="rounded-full w-20 h-20">
                <Mic className="w-8 h-8" />
              </Button>
            )}

            {recordingStatus === 'recording' && (
              <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full w-20 h-20">
                <Square className="w-8 h-8" />
              </Button>
            )}

            {recordingStatus === 'stopped' && audioUrl && (
              <div className="w-full space-y-4">
                <audio controls src={audioUrl} className="w-full" />
                <div className="flex flex-col sm:flex-row justify-center gap-2">
                   <Button onClick={handleAnalyze} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isLoading ? 'Analyzing & Saving...' : 'Analyze & Save Journal'}
                   </Button>
                   <Button onClick={resetRecording} variant="outline" disabled={isLoading}>
                      <Trash2 className="mr-2 h-4 w-4"/> Discard
                   </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading && !analysisResult && (
            <div className="text-center p-10">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary"/>
                <p className="mt-4 text-muted-foreground">Analyzing your voice journal...</p>
            </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Last Analysis Results</h2>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Lightbulb className="w-5 h-5 text-yellow-500"/>
                                Your Mood
                            </CardTitle>
                            <Badge variant="outline" className="mt-2 capitalize text-base">{analysisResult.mood}</Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                       <Quote className="w-5 h-5 text-primary"/>
                       Transcription
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">"{analysisResult.transcription}"</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                       <ListChecks className="w-5 h-5 text-green-500"/>
                       Suggestions for you
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        {analysisResult.solutions.map((solution, index) => (
                            <li key={index}>{solution}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
