
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateAffirmation } from '@/ai/flows/generate-affirmation';
import { useToast } from '@/hooks/use-toast';

interface LastEntry {
    mood: string;
    createdAt: Timestamp;
}

export default function AffirmationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [lastEntry, setLastEntry] = useState<LastEntry | null>(null);
    const [affirmation, setAffirmation] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, 'journalEntries'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const latestDoc = querySnapshot.docs[0];
                    setLastEntry(latestDoc.data() as LastEntry);
                } else {
                    setLastEntry(null); // No entries yet
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching last entry: ", error);
                toast({ title: "Error", description: "Could not fetch your latest mood.", variant: "destructive" });
                setIsLoading(false);
            });

            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    const handleGenerateAffirmation = useCallback(async () => {
        setIsGenerating(true);
        try {
            // Use the last known mood, or a default if no entries exist
            const mood = lastEntry?.mood || 'neutral';
            const result = await generateAffirmation({ mood });
            setAffirmation(result.affirmation);
        } catch (error) {
            console.error("Error generating affirmation: ", error);
            toast({ title: "Error", description: "Could not generate an affirmation.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    }, [lastEntry, toast]);
    
    // Generate affirmation on initial load
    useEffect(() => {
        if (!isLoading) {
           handleGenerateAffirmation();
        }
    }, [isLoading, handleGenerateAffirmation]);

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Your Daily Affirmation</h1>
                      <p className="text-sm text-muted-foreground">
                          A positive thought, just for you.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
                 {isLoading ? (
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : (
                    <Card className="w-full max-w-lg text-center shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2">
                                <Sparkles className="w-6 h-6 text-primary" />
                                Today's Focus
                            </CardTitle>
                             <CardDescription>
                                {lastEntry ? `Based on your recent feeling of "${lastEntry.mood}"` : "Here is a thought to start your day"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8">
                            {isGenerating ? (
                                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                            ) : (
                                <p className="text-2xl md:text-3xl font-semibold italic text-foreground">
                                    "{affirmation}"
                                </p>
                            )}
                        </CardContent>
                        <CardContent>
                             <Button onClick={handleGenerateAffirmation} disabled={isGenerating}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate New
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
