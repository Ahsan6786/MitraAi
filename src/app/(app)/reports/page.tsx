'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquareText, Mic, PenSquare } from 'lucide-react';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    type: 'text' | 'voice';
    mood: string;
    content?: string;
    transcription?: string;
    doctorReport: string;
    reviewed: boolean;
}

export default function ReportsPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, 'journalEntries'),
                where('reviewed', '==', true),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const entriesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as JournalEntry));
                setEntries(entriesData);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching reports: ", error);
                setIsLoading(false);
            });

            return () => unsubscribe();
        }
    }, [user]);

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-4">
                <h1 className="text-xl font-bold font-headline">Doctor's Reports</h1>
                <p className="text-sm text-muted-foreground">
                    View feedback from your doctor on your journal entries.
                </p>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : entries.length === 0 ? (
                    <Card className="text-center p-10">
                         <CardTitle>No Reports Yet</CardTitle>
                        <CardDescription className="mt-2">
                            Once a doctor reviews your journal entries, their reports will appear here.
                        </CardDescription>
                    </Card>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {entries.map(entry => {
                             const entryContent = entry.type === 'text' ? entry.content : entry.transcription;
                             return (
                                <AccordionItem value={entry.id} key={entry.id} className="border rounded-lg bg-card">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex items-center gap-4">
                                            {entry.type === 'text' ? <PenSquare className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
                                            <div>
                                                <div className="font-semibold">
                                                {entry.type === 'text' ? 'Text Journal' : 'Voice Journal'} - {entry.createdAt.toDate().toLocaleDateString()}
                                                </div>
                                                <Badge variant="outline" className="mt-1 capitalize">{entry.mood}</Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">Your Entry:</h4>
                                                <p className="text-sm text-muted-foreground italic">
                                                    "{entryContent}"
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                                                    <MessageSquareText className="w-4 h-4 text-green-600"/>
                                                    Doctor's Report:
                                                </h4>
                                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                                    {entry.doctorReport}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             );
                        })}
                    </Accordion>
                )}
            </main>
        </div>
    );
}
