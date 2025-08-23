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
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
    id: string;
    userId: string;
    userEmail: string;
    type: 'text' | 'voice';
    createdAt: Timestamp;
    mood: string;
    content?: string;
    audioUrl?: string;
    transcription?: string;
    reviewed: boolean;
    doctorReport?: string;
}

function ReportDialog({ entry }: { entry: JournalEntry }) {
    const [report, setReport] = useState(entry.doctorReport || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                   <MessageSquarePlus className="mr-2 h-4 w-4"/>
                   {entry.reviewed ? 'Edit Report' : 'Add Report'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Doctor's Report for {entry.userEmail}</DialogTitle>
                    <DialogDescription>
                        Review the user's entry and provide your feedback below.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Write your report here..."
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

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/chat');
        }
    }, [user, loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            const q = query(collection(db, 'journalEntries'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const entriesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as JournalEntry));
                setEntries(entriesData);
                setIsLoadingEntries(false);
            });

            return () => unsubscribe();
        }
    }, [isAdmin]);


    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-4">
                <h1 className="text-xl font-bold font-headline">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Review user journal entries.</p>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
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
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Mood</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">{entry.userEmail}</TableCell>
                                            <TableCell><Badge variant={entry.type === 'text' ? 'secondary' : 'outline'}>{entry.type}</Badge></TableCell>
                                            <TableCell>{entry.createdAt.toDate().toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{entry.mood}</TableCell>
                                            <TableCell>
                                                {entry.type === 'text' && <p className="truncate max-w-xs">{entry.content}</p>}
                                                {entry.type === 'voice' && entry.audioUrl && (
                                                    <audio controls src={entry.audioUrl} className="w-64 h-10">
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                )}
                                            </TableCell>
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
