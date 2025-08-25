
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { analyzeVoiceJournal } from '@/ai/flows/analyze-voice-journal';
import { Loader2, Mic, Square, Lightbulb, ListChecks, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { useMusic } from '@/hooks/use-music';
import { ThemeToggle } from '@/components/theme-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

interface AnalysisResult {
    mood: string;
    solutions: string[];
}

const languageToSpeechCode: Record<string, string> = {
    English: 'en-US',
    Hindi: 'hi-IN',
    Hinglish: 'en-IN',
    Arabic: 'ar-SA',
    French: 'fr-FR',
    German: 'de-DE',
    Bhojpuri: 'en-IN',
};


export default function VoiceJournalPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [language, setLanguage] = useState('English');

  const recognitionRef = useRef<any | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');

  const { toast } = useToast();
  const { user } = useAuth();
  const { pauseMusic, resumeMusic } = useMusic();

  const handleAnalyze = useCallback(async (transcription: string) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (!transcription.trim()) {
      toast({ title: 'Empty Journal', description: 'No speech was detected to analyze.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeVoiceJournal({ transcription });
      
      await addDoc(collection(db, 'journalEntries'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'voice',
        mood: result.mood,
        transcription: transcription,
        solutions: result.solutions,
        createdAt: serverTimestamp(),
        reviewed: false,
        doctorReport: null,
      });
      
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete & Saved",
        description: "Your voice journal has been successfully saved.",
      });

    } catch (error: any) {
      console.error('Error during analysis or save:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Sorry, we could not process your journal right now.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  }, []);

  const startRecording = () => {
     if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support live transcription.",
        variant: "destructive",
      });
      return;
    }
    pauseMusic();
    setTranscript('');
    finalTranscriptRef.current = '';
    setAnalysisResult(null);
    setIsRecording(true);

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = languageToSpeechCode[language] || 'en-US';

    recognitionRef.current.onresult = (event: any) => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        finalTranscriptRef.current += finalTranscript;
        setTranscript(finalTranscriptRef.current + interimTranscript);

        silenceTimeoutRef.current = setTimeout(() => {
            stopRecording();
        }, 1500);
    };
    
    recognitionRef.current.onend = () => {
        setIsRecording(false);
        resumeMusic();
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

        const finalTranscription = finalTranscriptRef.current.trim();
        handleAnalyze(finalTranscription);
        recognitionRef.current = null;
    }

    recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({ title: 'Voice Error', description: 'There was an error with voice recognition.', variant: 'destructive' });
        setIsRecording(false);
        resumeMusic();
        recognitionRef.current = null;
    };
    
    recognitionRef.current.start();
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);


  return (
    <div className="h-full flex flex-col bg-muted/20">
      <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">Voice Journal</h1>
            <p className="text-sm text-muted-foreground">Speak your mind, discover your mood.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Languages className="w-5 h-5 text-muted-foreground hidden sm:block"/>
            <Select value={language} onValueChange={setLanguage} disabled={isRecording || isLoading}>
                <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Hinglish">Hinglish</SelectItem>
                    <SelectItem value="Bhojpuri">Bhojpuri</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                </SelectContent>
            </Select>
            <ThemeToggle />
        </div>
      </header>
      <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Speak Your Mind</CardTitle>
            <CardDescription>
                {isRecording 
                    ? "I'm listening... Speak freely. I'll stop and analyze when you pause."
                    : "Press the mic to start. Your words will appear here as you talk."
                }
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
             <Textarea
              placeholder="Your live transcription will appear here..."
              value={transcript}
              readOnly
              rows={6}
              className="resize-none text-base italic w-full max-w-lg"
            />
            {isRecording && (
               <div className="text-primary flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span>Listening...</span>
              </div>
            )}
          </CardContent>
           <CardFooter className="flex-col gap-4">
             <Button 
                onClick={isRecording ? stopRecording : startRecording} 
                size="lg" 
                variant={isRecording ? 'destructive' : 'default'}
                className="rounded-full w-20 h-20 shadow-lg"
                disabled={isLoading}
             >
                {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
             </Button>
              <p className="text-sm text-muted-foreground h-5">
                {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Analyzing...</span>
                ) : isRecording ? (
                    'Press button to stop manually'
                ) : (
                    analysisResult ? 'Recording complete. See results below.' : 'Press the mic to start speaking'
                )}
             </p>
           </CardFooter>
        </Card>

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
                       <ListChecks className="w-5 h-5 text-green-500"/>
                       {analysisResult.mood.toLowerCase() === 'neutral' ? 'A Deeper Look' : 'Suggestions for you'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.mood.toLowerCase() === 'neutral' ? (
                     <div className="space-y-2 text-muted-foreground">
                        <p>It seems like your entry was a bit brief. For a more accurate mood analysis, try speaking a little more.</p>
                        <p className="font-semibold pt-2">You could try talking about:</p>
                        <ul className="list-disc pl-5">
                            <li>How your day has been overall.</li>
                            <li>Something specific that happened.</li>
                            <li>How you are feeling physically or emotionally right now.</li>
                        </ul>
                     </div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        {analysisResult.solutions.map((solution, index) => (
                            <li key={index}>{solution}</li>
                        ))}
                    </ul>
                  )}
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
