
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Heart, Share2 } from 'lucide-react';
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
            <main className="flex-1 overflow-auto p-4 sm:px-6 lg:px-8 flex items-center justify-center">
                 {isLoading ? (
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : (
                    <div className="mx-auto w-full max-w-5xl">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Your Daily Affirmation</h1>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {lastEntry ? (
                                    <>
                                        Based on your current mood: <span className="font-semibold text-primary capitalize">{lastEntry.mood}</span>
                                    </>
                                ) : "Here is a thought to start your day"}
                            </p>
                        </div>
                        <div className="relative mt-12">
                            <div className="absolute inset-0 -z-10 overflow-hidden">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/10 blur-3xl"></div>
                            </div>
                            <div className="mx-auto max-w-2xl rounded-2xl bg-card/60 p-8 shadow-lg backdrop-blur-md">
                                <div className="relative flex flex-col items-center justify-center text-center">
                                    <Sparkles className="h-10 w-10 text-primary" />
                                     {isGenerating ? (
                                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary my-8" />
                                    ) : (
                                        <p className="mt-6 text-2xl font-medium text-foreground md:text-3xl">
                                            "{affirmation}"
                                        </p>
                                    )}
                                    <div className="mt-8 flex items-center justify-center gap-4">
                                        <Button variant="outline" className="rounded-full bg-background/70">
                                            <Heart className="mr-2 h-4 w-4"/> Favorite
                                        </Button>
                                        <Button variant="outline" className="rounded-full bg-background/70">
                                            <Share2 className="mr-2 h-4 w-4"/> Share
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-center">
                                 <Button onClick={handleGenerateAffirmation} disabled={isGenerating} size="lg" className="rounded-full shadow-lg">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    New Affirmation
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
