'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeVoiceJournal, AnalyzeVoiceJournalOutput } from '@/ai/flows/analyze-voice-journal';
import { Loader2, Mic, Square, Trash2, Lightbulb, ListChecks, Quote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


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
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
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

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await analyzeVoiceJournal({ audioDataUri: base64Audio });
        
        // Save analysis to Firestore
        await addDoc(collection(db, 'journalEntries'), {
          userId: user.uid,
          userEmail: user.email,
          type: 'voice',
          mood: result.mood,
          transcription: result.transcription,
          solutions: result.solutions,
          createdAt: serverTimestamp(),
          reviewed: false,
          doctorReport: null,
        });

        setAnalysisResult(result); // Keep results on screen
        toast({
          title: "Analysis Complete & Saved",
          description: "Your voice journal transcript has been saved.",
        });

      } catch (error) {
         console.error('Error analyzing or saving audio:', error);
         toast({
          title: 'Analysis Failed',
          description: 'Sorry, we could not process your audio right now.',
          variant: 'destructive',
        });
      } finally {
          setIsLoading(false);
      }
    };
    reader.onerror = (error) => {
        console.error('Error reading audio file:', error);
        toast({
            title: 'Processing Error',
            description: 'There was an error processing your audio file.',
            variant: 'destructive',
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold font-headline">Voice Journal</h1>
        <p className="text-sm text-muted-foreground">Speak your mind, discover your mood.</p>
      </header>
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
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
                <div className="flex justify-center gap-2">
                   <Button onClick={handleAnalyze} disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isLoading ? 'Analyzing & Saving...' : 'Analyze & Save Transcript'}
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
            <h2 className="text-lg font-semibold font-headline">Last Analysis Results</h2>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="flex items-center gap-2">
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
                    <CardTitle className="flex items-center gap-2">
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
                    <CardTitle className="flex items-center gap-2">
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
