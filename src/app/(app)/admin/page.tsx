
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chatEmpatheticTone } from '@/ai/flows/chat-empathetic-tone';
import Link from 'next/link';

interface JournalEntry {
    id: string;
    userId: string;
    userEmail: string;
    type: 'text' | 'voice';
    createdAt: Timestamp;
    mood: string;
    content?: string; // For text journals
    transcription?: string; // For voice journals
    audioUrl?: string; // For voice journals
    reviewed: boolean;
    doctorReport?: string;
}

function ReportDialog({ entry }: { entry: JournalEntry }) {
    const [report, setReport] = useState(entry.doctorReport || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [language, setLanguage] = useState('English');
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const entryRef = doc(db, 'journalEntries', entry.id);
            await updateDoc(entryRef, {
                doctorReport: report,
                reviewed: true,
            });
            toast({ title: "Success", description: "Report saved successfully." });
            setIsOpen(false);
        } catch (error) {
            console.error("Error saving report: ", error);
            toast({ title: "Error", description: "Failed to save report.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            const prompt = `Based on the following journal entry and mood, please draft a supportive and professional doctor's report. Address the user's feelings and suggest potential next steps or points for discussion.
            
            Mood: ${entry.mood}
            Entry: "${entryContent}"
            
            Draft the report in ${language}.`;

            const result = await chatEmpatheticTone({ message: prompt, language });
            setReport(result.response);
        } catch (error) {
            console.error("Error generating report:", error);
            toast({ title: "Error", description: "Failed to generate AI report.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const entryContent = entry.content || entry.transcription || 'No content available.';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                   <MessageSquarePlus className="mr-2 h-4 w-4"/>
                   {entry.reviewed ? 'Edit Report' : 'Add Report'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Doctor's Report for {entry.userEmail}</DialogTitle>
                    <DialogDescription>
                        Review the user's entry and provide your feedback below. You can also use AI to generate a draft.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                     {entry.type === 'voice' && entry.audioUrl && (
                        <div className="mb-2">
                             <h4 className="font-semibold text-sm mb-2">Voice Recording:</h4>
                             <audio controls src={entry.audioUrl} className="w-full">
                                Your browser does not support the audio element.
                             </audio>
                        </div>
                     )}
                     <div className="mb-2">
                        <h4 className="font-semibold text-sm">AI Transcription:</h4>
                        <p className="text-sm text-muted-foreground italic p-2 bg-muted rounded-md max-h-40 overflow-y-auto">
                           "{entryContent}"
                        </p>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Hindi">Hindi</SelectItem>
                                <SelectItem value="Hinglish">Hinglish</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="w-full sm:w-auto"
                            variant="outline"
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                            Generate Report
                        </Button>
                     </div>
                    <Textarea
                        placeholder="Write your report here, or generate one with AI."
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                        rows={8}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function AdminPage() {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        } else if (!loading && user && !isAdmin) {
             router.push('/chat');
        }
    }, [user, loading, isAdmin, router]);

    useEffect(() => {
        if (user && isAdmin) {
            setIsLoadingEntries(true);
             const q = query(
              collection(db, 'journalEntries'),
              orderBy('createdAt', 'desc')
            );
      
            const unsubscribe = onSnapshot(
              q,
              (querySnapshot) => {
                const entriesData = querySnapshot.docs.map(
                  (doc) =>
                    ({
                      id: doc.id,
                      ...doc.data(),
                    } as JournalEntry)
                );
                setEntries(entriesData);
                setIsLoadingEntries(false);
              },
              (error) => {
                console.error('Error fetching journal entries: ', error);
                toast({
                  title: 'Error',
                  description:
                    'Could not fetch journal entries. Please check Firestore security rules and indexes.',
                  variant: 'destructive',
                });
                setIsLoadingEntries(false);
              }
            );
      
            return () => unsubscribe();
          }
    }, [user, isAdmin, toast]);


    if (loading || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-screen">
                 <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Admin Panel</h1>
                        <p className="text-sm text-muted-foreground">Review user journal entries.</p>
                    </div>
                </div>
                 <Button variant="outline" asChild>
                    <Link href="/chat">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Chat
                    </Link>
                </Button>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Journal Entries</CardTitle>
                        <CardDescription>
                            Review and manage user-submitted journal and voice entries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingEntries ? (
                             <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                             </div>
                        ) : entries.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">No journal entries have been submitted yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                                        <TableHead>Mood</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">
                                                <div className="truncate max-w-[120px] sm:max-w-none">{entry.userEmail}</div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell"><Badge variant={entry.type === 'text' ? 'secondary' : 'outline'}>{entry.type}</Badge></TableCell>
                                            <TableCell className="hidden lg:table-cell">{entry.createdAt?.toDate().toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{entry.mood}</TableCell>
                                            <TableCell>
                                                <Badge variant={entry.reviewed ? 'default' : 'destructive'}>
                                                    {entry.reviewed ? 'Reviewed' : 'Pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <ReportDialog entry={entry} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
