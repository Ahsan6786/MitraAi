
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookHeart, Trash2, Mic, PenSquare, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { predictUserMood } from '@/ai/flows/predict-user-mood';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';

interface JournalEntry {
  id: string;
  createdAt: Timestamp;
  type: 'text';
  mood: string;
  content: string;
  userId: string;
  reviewed: boolean;
  doctorReport?: string;
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete Firestore document
            await deleteDoc(doc(db, 'journalEntries', entry.id));
            toast({ title: "Entry Deleted", description: "Your journal entry has been removed." });
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast({ title: "Error", description: "Could not delete the entry.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {entry.type === 'text' ? <PenSquare className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
                            <span>{entry.createdAt?.toDate().toLocaleDateString()}</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {entry.createdAt?.toDate().toLocaleTimeString()}
                        </CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your journal entry.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground italic whitespace-pre-wrap">"{entry.content}"</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Detected Mood:</span>
                    <Badge variant="secondary" className="capitalize">{entry.mood}</Badge>
                </div>
                {entry.reviewed && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Reviewed by a doctor. <Link href="/reports" className="underline">View report</Link></span>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

function JournalPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entry, setEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'journalEntries'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
        setEntries(userEntries);
        setIsLoadingEntries(false);
      }, (error) => {
        console.error("Error fetching journal entries:", error);
        toast({ title: "Error", description: "Could not fetch your journal entries.", variant: "destructive" });
        setIsLoadingEntries(false);
      });
      return () => unsubscribe();
    }
  }, [user, toast]);

  const handleSaveTextEntry = async () => {
    if (!entry.trim() || !user) return;
    setIsSubmitting(true);
    try {
      // 1. Get mood from AI
      const moodResult = await predictUserMood({ journalEntry: entry });

      // 2. Save to Firestore
      await addDoc(collection(db, 'journalEntries'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'text',
        content: entry,
        mood: moodResult.mood,
        confidence: moodResult.confidence,
        createdAt: serverTimestamp(),
        reviewed: false,
        doctorReport: null,
      });

      toast({ title: "Entry Saved", description: `We've logged your entry. Detected mood: ${moodResult.mood}` });
      setEntry('');
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast({ title: "Error saving entry", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">Your Private Journal</h1>
              <p className="text-sm text-muted-foreground">
                Write down your thoughts to track your mood.
              </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <GenZToggle />
            <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Entry Form */}
          <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PenSquare className="w-6 h-6 text-primary"/> How are you feeling today?
                    </CardTitle>
                    <CardDescription>
                        Write anything that's on your mind. It's completely private.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Textarea
                        placeholder="Start writing here..."
                        rows={10}
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        disabled={isSubmitting}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button onClick={handleSaveTextEntry} disabled={isSubmitting || !entry.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save & Analyze
                    </Button>
                </CardFooter>
            </Card>

             <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="w-5 h-5"/>
                        Need Professional Review?
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                       After saving, your entries are sent to a certified doctor for review. You can view their feedback in the <Link href="/reports" className="font-semibold underline">Doctor's Reports</Link> section.
                    </p>
                </CardContent>
             </Card>
          </div>

          {/* Right Column: Past Entries */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Recent Entries</h2>
             {isLoadingEntries ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : entries.length === 0 ? (
                <Card className="text-center p-6">
                    <BookHeart className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                    <CardTitle>No Entries Yet</CardTitle>
                    <CardDescription className="mt-2">
                        Your past journal entries will appear here.
                    </CardDescription>
                </Card>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {entries.map(e => <JournalEntryCard key={e.id} entry={e} />)}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function JournalPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenJournalIntro';

    useEffect(() => {
        setIsClient(true);
        const hasSeen = sessionStorage.getItem(SESSION_KEY);
        if (hasSeen) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <SectionIntroAnimation 
            onFinish={handleIntroFinish} 
            icon={<BookHeart className="w-full h-full" />}
            title="Your Journal"
            subtitle="A private space for your thoughts."
        />;
    }

    return <JournalPageContent />;
}
