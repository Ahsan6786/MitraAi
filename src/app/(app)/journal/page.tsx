'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { predictUserMood } from '@/ai/flows/predict-user-mood';
import { Frown, Loader2, Meh, Smile } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  id: number;
  date: string;
  entry: string;
  mood: string;
  confidence: number;
}

const MoodIcon = ({ mood }: { mood: string }) => {
  const moodLower = mood.toLowerCase();
  if (moodLower.includes('happy') || moodLower.includes('joy')) {
    return <Smile className="w-8 h-8 text-green-500" />;
  }
  if (moodLower.includes('sad') || moodLower.includes('depressed')) {
    return <Frown className="w-8 h-8 text-blue-500" />;
  }
  if (moodLower.includes('anxious') || moodLower.includes('stressed') || moodLower.includes('worried')) {
    return <Meh className="w-8 h-8 text-yellow-500" />;
  }
  return <Meh className="w-8 h-8 text-gray-500" />;
};

export default function JournalPage() {
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveEntry = async () => {
    if (!journalText.trim()) {
       toast({
        title: "Empty Entry",
        description: "Please write something in your journal before saving.",
        variant: "destructive",
      });
      return;
    };
    setIsLoading(true);

    try {
      const result = await predictUserMood({ journalEntry: journalText });
      const newEntry: JournalEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        entry: journalText,
        mood: result.mood,
        confidence: result.confidence,
      };
      setEntries([newEntry, ...entries]);
      setJournalText('');
       toast({
        title: "Entry Saved",
        description: `We've analyzed and saved your journal entry.`,
      });
    } catch (error) {
      console.error('Error predicting mood:', error);
       toast({
        title: "Analysis Failed",
        description: "Sorry, we couldn't analyze your mood right now. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold font-headline">Daily Mood Journal</h1>
        <p className="text-sm text-muted-foreground">Reflect on your day, understand your emotions.</p>
      </header>
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
            <CardDescription>Write down your thoughts and feelings. Our AI will help you identify your mood.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Start writing here..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveEntry} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Analyzing...' : 'Analyze & Save Mood'}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold font-headline">Past Entries</h2>
             {entries.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <p>Your saved journal entries will appear here.</p>
                </div>
            ) : (
                entries.map((entry) => (
                    <Card key={entry.id}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-base">{entry.date}</CardTitle>
                                <Badge variant="outline" className="mt-2 capitalize">{entry.mood}</Badge>
                            </div>
                            <MoodIcon mood={entry.mood} />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.entry}</p>
                        </CardContent>
                         <CardFooter className="flex-col items-start gap-2">
                            <p className="text-xs text-muted-foreground">AI Confidence</p>
                            <Progress value={entry.confidence * 100} className="h-2"/>
                        </CardFooter>
                    </Card>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
