
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic, PenSquare, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDoctorReport } from '@/ai/flows/generate-doctor-report';
import { ThemeToggle } from '@/components/theme-toggle';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    type: 'text' | 'voice';
    mood: string;
    content?: string;
    transcription?: string;
    userId: string;
    userEmail: string;
    reviewed: boolean;
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reports, setReports] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        if (loading) {
          return;
        }
        if (!user) {
          router.push('/signin');
          return;
        }
        if (user.email !== ADMIN_EMAIL) {
          router.push('/chat');
          return;
        }

        const q = query(
            collection(db, 'journalEntries'),
            where('reviewed', '==', false)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const entriesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as JournalEntry));
            
            // Sort entries by date client-side to avoid complex index
            entriesData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

            setEntries(entriesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching entries for admin: ", error);
            toast({
                title: "Error Fetching Data",
                description: "Could not fetch journal entries. Please try again later.",
                variant: "destructive"
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, loading, router, toast]);
    
    const handleReportChange = (id: string, value: string) => {
        setReports(prev => ({ ...prev, [id]: value }));
    };

    const handleGenerateReport = async (entry: JournalEntry) => {
        setIsGenerating(prev => ({...prev, [entry.id]: true}));
        try {
            const result = await generateDoctorReport({
                entry: entry.content || entry.transcription || '',
                mood: entry.mood,
            });
            handleReportChange(entry.id, result.report);
        } catch (error) {
            console.error("Failed to generate report:", error);
            toast({
                title: "Generation Failed",
                description: "Could not generate AI draft report.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(prev => ({...prev, [entry.id]: false}));
        }
    }

    const handleSubmitReview = async (id: string) => {
        const reportText = reports[id];
        if (!reportText || !reportText.trim()) {
            toast({ title: "Empty Report", description: "Please write a report before submitting.", variant: "destructive" });
            return;
        }

        setIsSubmitting(prev => ({...prev, [id]: true}));
        try {
            const entryRef = doc(db, 'journalEntries', id);
            await updateDoc(entryRef, {
                reviewed: true,
                doctorReport: reportText,
            });
            toast({ title: "Review Submitted", description: "The report has been saved and the user will be notified." });
            setReports(prev => {
                const newReports = {...prev};
                delete newReports[id];
                return newReports;
            });
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast({ title: "Submission Failed", variant: "destructive" });
        } finally {
             setIsSubmitting(prev => ({...prev, [id]: false}));
        }
    }


    if (loading || !user) {
        return (
             <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }
    
    if (user.email !== ADMIN_EMAIL) {
        return null;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                          <ShieldCheck className="w-6 h-6 text-primary"/>
                          Admin Panel
                      </h1>
                      <p className="text-sm text-muted-foreground">
                          Review user journal entries.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : entries.length === 0 ? (
                    <Card className="text-center p-6 md:p-10">
                         <CardTitle>All Caught Up!</CardTitle>
                        <CardDescription className="mt-2">
                            There are no new journal entries to review.
                        </CardDescription>
                    </Card>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {entries.map(entry => {
                             const entryContent = entry.type === 'text' ? entry.content : entry.transcription;
                             return (
                                <AccordionItem value={entry.id} key={entry.id} className="border rounded-lg bg-card">
                                    <AccordionTrigger className="p-4 hover:no-underline text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                                            <div className="flex items-center gap-4">
                                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                                {entry.type === 'text' ? <PenSquare className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold">
                                                  {entry.userEmail}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {entry.createdAt.toDate().toLocaleString()}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="capitalize mt-1 sm:mt-0">{entry.mood}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">User's Entry:</h4>
                                                <p className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md">
                                                    "{entryContent}"
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                 <h4 className="font-semibold text-sm">Doctor's Report:</h4>
                                                 <Textarea 
                                                    placeholder="Write your feedback here..."
                                                    rows={5}
                                                    value={reports[entry.id] || ''}
                                                    onChange={(e) => handleReportChange(entry.id, e.target.value)}
                                                    disabled={isSubmitting[entry.id] || isGenerating[entry.id]}
                                                 />
                                                 <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button 
                                                        onClick={() => handleSubmitReview(entry.id)} 
                                                        disabled={isSubmitting[entry.id] || isGenerating[entry.id]}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        {isSubmitting[entry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                        Submit Review
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => handleGenerateReport(entry)} 
                                                        disabled={isSubmitting[entry.id] || isGenerating[entry.id]}
                                                         className="w-full sm:w-auto"
                                                    >
                                                        {isGenerating[entry.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                                        Generate Draft
                                                    </Button>
                                                 </div>
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
