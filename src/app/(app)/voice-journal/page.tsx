
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { predictUserMood } from '@/ai/flows/predict-user-mood';
import { generateSuggestions } from '@/ai/flows/generate-suggestions';
import { Loader2, Mic, Square, Lightbulb, ListChecks, Languages, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { useMusic } from '@/hooks/use-music';
import { ThemeToggle } from '@/components/theme-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

type PageState = 'idle' | 'recording' | 'transcribed' | 'analyzing' | 'analyzed';

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
  const [pageState, setPageState] = useState<PageState>('idle');
  const [transcript, setTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [language, setLanguage] = useState('English');

  const recognitionRef = useRef<any | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { pauseMusic, resumeMusic } = useMusic();

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null; // Important to nullify to prevent re-entry
      setPageState(transcript ? 'transcribed' : 'idle');
      resumeMusic();
    }
  }, [resumeMusic, transcript]);


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
    setAnalysisResult(null);
    setPageState('recording');

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageToSpeechCode[language] || 'en-US';

    recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setTranscript(finalTranscript + interimTranscript);
    };
    
    recognition.onend = () => {
        if (pageState === 'recording') {
            stopRecording();
        }
    }

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({ title: 'Voice Error', description: `Could not start voice recognition: ${event.error}`, variant: 'destructive' });
        setPageState('idle');
        resumeMusic();
        recognitionRef.current = null;
    };
    
    recognition.start();
  };

  const handleMicClick = () => {
    if (pageState === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAnalyzeAndSave = async () => {
    if (!transcript.trim()) {
      toast({ title: 'Empty Journal', description: 'There is no text to analyze.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    
    setPageState('analyzing');
    setAnalysisResult(null);

    try {
      // 1. Predict Mood
      const moodResult = await predictUserMood({ journalEntry: transcript });
      const detectedMood = moodResult.mood || 'neutral';

      // 2. Generate Suggestions
      const suggestionsResult = await generateSuggestions({ mood: detectedMood });
      const solutions = suggestionsResult.suggestions;
      
      // 3. Save to Firestore
      await addDoc(collection(db, 'journalEntries'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'voice',
        mood: detectedMood,
        transcription: transcript,
        solutions: solutions,
        createdAt: serverTimestamp(),
        reviewed: false, // Default values for admin review
        doctorReport: null,
      });
      
      // 4. Update UI
      setAnalysisResult({ mood: detectedMood, solutions: solutions });
      setPageState('analyzed');
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
      setPageState('transcribed'); // Go back to transcribed state on failure
    }
  };


  useEffect(() => {
    // Cleanup function to stop recording if component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const isMicDisabled = pageState === 'analyzing';

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
            <Select value={language} onValueChange={setLanguage} disabled={isMicDisabled}>
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
                {pageState === 'recording' 
                    ? "I'm listening... Press the button again to stop."
                    : "Press the mic to start recording. Your words will appear here."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Textarea
              placeholder="Your live transcription will appear here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              className="resize-none text-base italic"
              readOnly={pageState === 'recording'}
            />
          </CardContent>
           <CardFooter className="flex-col gap-4">
             <div className="flex items-center gap-4">
                <Button 
                    onClick={handleMicClick}
                    size="lg" 
                    variant={pageState === 'recording' ? 'destructive' : 'default'}
                    className="rounded-full w-20 h-20 shadow-lg"
                    disabled={isMicDisabled}
                >
                    {pageState === 'recording' ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </Button>

                {(pageState === 'transcribed' || pageState === 'analyzed') && (
                    <Button
                        onClick={handleAnalyzeAndSave}
                        size="lg"
                        disabled={pageState === 'analyzing' || !transcript.trim()}
                    >
                        <Sparkles className="mr-2 h-5 w-5"/>
                        Analyze & Save
                    </Button>
                )}
             </div>
              <div className="text-sm text-muted-foreground h-5 flex items-center justify-center">
                {pageState === 'analyzing' && <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Analyzing & Saving...</span>}
                {pageState === 'recording' && (
                    <div className="text-primary flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        Listening...
                    </div>
                )}
             </div>
           </CardFooter>
        </Card>

        {pageState === 'analyzed' && analysisResult && (
          <div className="space-y-4 animate-in fade-in-50">
            <h2 className="text-lg font-semibold">Last Analysis Results</h2>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Lightbulb className="w-5 h-5 text-primary"/>
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
                       <ListChecks className="w-5 h-5 text-green-600"/>
                       Suggestions For You
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
