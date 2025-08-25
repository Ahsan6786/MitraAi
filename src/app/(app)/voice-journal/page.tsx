
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { predictUserMood } from '@/ai/flows/predict-user-mood';
import { generateSuggestions } from '@/ai/flows/generate-suggestions';
import { Loader2, Mic, Square, Lightbulb, ListChecks, Languages } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [language, setLanguage] = useState('English');

  const recognitionRef = useRef<any | null>(null);
  const finalTranscriptRef = useRef('');

  const { toast } = useToast();
  const { user } = useAuth();
  const { pauseMusic, resumeMusic } = useMusic();
  
  const handleAnalyzeAndSave = useCallback(async (finalTranscription: string) => {
    if (!finalTranscription.trim()) {
      toast({ title: 'Empty Journal', description: 'No speech was detected to analyze.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      // Step 1: Predict mood using the reliable text journal flow
      const moodResult = await predictUserMood({ journalEntry: finalTranscription });
      const detectedMood = moodResult.mood || 'neutral';

      // Step 2: Generate solutions based on the detected mood
      const suggestionsResult = await generateSuggestions({ mood: detectedMood });
      const solutions = suggestionsResult.suggestions;
      
      await addDoc(collection(db, 'journalEntries'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'voice',
        mood: detectedMood,
        transcription: finalTranscription,
        solutions: solutions,
        createdAt: serverTimestamp(),
        reviewed: false,
        doctorReport: null,
      });
      
      setAnalysisResult({ mood: detectedMood, solutions: solutions });
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
        // The 'onend' event will handle cleanup and analysis
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

    if (isRecording || isLoading) return;

    pauseMusic();
    setTranscript('');
    finalTranscriptRef.current = '';
    setAnalysisResult(null);
    setIsRecording(true);

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageToSpeechCode[language] || 'en-US';

    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current + interimTranscript);
    };
    
    recognition.onend = () => {
        setIsRecording(false);
        resumeMusic();
        recognitionRef.current = null;
        
        const finalTranscription = finalTranscriptRef.current.trim();
        setTranscript(finalTranscription); 
        if (finalTranscription) {
            handleAnalyzeAndSave(finalTranscription);
        }
    }

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({ title: 'Voice Error', description: `Could not start voice recognition: ${event.error}`, variant: 'destructive' });
        setIsRecording(false);
        resumeMusic();
        recognitionRef.current = null;
    };
    
    recognition.start();
  };

  useEffect(() => {
    // Cleanup function to stop recording if the component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
                    ? "I'm listening... Speak freely. Press the stop button when you're done."
                    : "Press the mic to start. Your words will appear here as you talk."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Textarea
              placeholder="Your live transcription will appear here..."
              value={transcript}
              readOnly
              rows={6}
              className="resize-none text-base italic w-full max-w-lg mx-auto"
            />
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
              <div className="text-sm text-muted-foreground h-5 flex items-center justify-center">
                {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Analyzing & Saving...</span>
                ) : isRecording ? (
                    <div className="text-primary flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        Listening...
                    </div>
                ) : (
                    analysisResult ? 'Recording complete. See results below.' : 'Press the mic to start speaking'
                )}
             </div>
           </CardFooter>
        </Card>

        {analysisResult && (
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
