
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDocs, doc, getDoc, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart, LineChart, FileQuestion, ArrowLeft, PenSquare, Mic, Send, MessageSquare } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';
const ADMIN_UID = 'ADMIN'; // A special UID for the admin/doctor

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    mood: string;
    type: 'text' | 'voice';
    content?: string;
    transcription?: string;
    reviewed: boolean;
    doctorReport?: string;
}

interface QuestionnaireSubmission {
    id: string;
    createdAt: Timestamp;
    testName: string;
    score: number;
    result: { level: string; recommendation: string; };
    reviewed: boolean;
    doctorFeedback?: string;
}

interface UserProfile {
    displayName?: string;
    email: string;
}

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}

// A simple mapping for mood to a numerical value for the line chart
const moodToValue = (mood: string): number => {
    const lowerMood = mood.toLowerCase();
    if (lowerMood.includes('happy') || lowerMood.includes('joyful') || lowerMood.includes('excited')) return 5;
    if (lowerMood.includes('good') || lowerMood.includes('calm')) return 4;
    if (lowerMood.includes('neutral')) return 3;
    if (lowerMood.includes('anxious') || lowerMood.includes('stressed')) return 2;
    if (lowerMood.includes('sad') || lowerMood.includes('angry')) return 1;
    return 3; // Default to neutral
};

const valueToEmoji = (value: number): string => {
    switch (value) {
        case 1: return '😔';
        case 2: return '😟';
        case 3: return '😐';
        case 4: return '😊';
        case 5: return '😄';
        default: return '';
    }
}

function UserMoodDashboard({ userId }: { userId: string }) {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [moodFrequencyData, setMoodFrequencyData] = useState<any[]>([]);
    const [moodTrendData7, setMoodTrendData7] = useState<any[]>([]);
    const [moodTrendData30, setMoodTrendData30] = useState<any[]>([]);

    useEffect(() => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const q = query(
            collection(db, 'journalEntries'),
            where('userId', '==', userId),
            where('createdAt', '>=', thirtyDaysAgo),
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
            console.error("Error fetching entries: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);
    
    useEffect(() => {
        if (entries.length > 0) {
            const moodCounts = entries.reduce((acc, entry) => {
                const mood = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
                acc[mood] = (acc[mood] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const frequencyData = Object.keys(moodCounts).map(mood => ({ name: mood, count: moodCounts[mood] }));
            setMoodFrequencyData(frequencyData);

            const processTrendData = (days: number) => {
                const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
                const dailyAverages = new Map<string, { total: number; count: number }>();
                entries.forEach(entry => {
                    const entryDate = startOfDay(entry.createdAt.toDate());
                    const entryDateString = format(entryDate, 'yyyy-MM-dd');
                    if (dailyAverages.has(entryDateString)) {
                        const current = dailyAverages.get(entryDateString)!;
                        current.total += moodToValue(entry.mood);
                        current.count += 1;
                    } else {
                        dailyAverages.set(entryDateString, { total: moodToValue(entry.mood), count: 1 });
                    }
                });
                return interval.map(date => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    const dayData = dailyAverages.get(dateString);
                    return {
                        name: format(date, days === 7 ? 'EEE' : 'MMM d'),
                        mood: dayData ? parseFloat((dayData.total / dayData.count).toFixed(2)) : null,
                    };
                });
            }
            setMoodTrendData7(processTrendData(7));
            setMoodTrendData30(processTrendData(30));
        }
    }, [entries]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (entries.length === 0) {
        return <Card className="text-center p-6 md:p-10"><CardTitle>No Journal Data</CardTitle><CardDescription className="mt-2">This user has not created any journal entries in the last 30 days.</CardDescription></Card>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Tabs defaultValue="weekly">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                            <CardTitle>Mood Overview</CardTitle>
                            <TabsList className="grid grid-cols-2 w-full sm:w-auto mt-4 sm:mt-0">
                                <TabsTrigger value="weekly">7 Days</TabsTrigger>
                                <TabsTrigger value="monthly">30 Days</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="weekly">
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsLineChart data={moodTrendData7} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0.5, 5.5]} ticks={[1,2,3,4,5]} tickFormatter={valueToEmoji} width={50} />
                                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} labelStyle={{ color: 'hsl(var(--foreground))' }}/>
                                    <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="monthly">
                             <ResponsiveContainer width="100%" height={300}>
                                <RechartsLineChart data={moodTrendData30} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                    <YAxis domain={[0.5, 5.5]} ticks={[1,2,3,4,5]} tickFormatter={valueToEmoji} width={50} />
                                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} labelStyle={{ color: 'hsl(var(--foreground))' }}/>
                                    <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls dot={false} />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5 text-primary"/>Mood Frequency</CardTitle>
                    <CardDescription>Frequency of each mood in the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={moodFrequencyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false}/>
                            <Tooltip cursor={{fill: 'hsl(var(--accent))'}} contentStyle={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}/>
                            <Bar dataKey="count" fill="hsl(var(--primary))" name="Times Felt" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function UserJournalEntries({ userId }: { userId: string }) {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'journalEntries'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
            setEntries(entriesData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (entries.length === 0) {
        return <Card className="text-center p-6 md:p-10"><CardTitle>No Journal Entries</CardTitle><CardDescription className="mt-2">This user has not created any journal entries.</CardDescription></Card>;
    }

    return (
        <div className="space-y-4">
            {entries.map(entry => (
                <Card key={entry.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                {entry.type === 'text' ? <PenSquare className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
                                <div>
                                    <CardTitle className="text-base">{entry.createdAt.toDate().toLocaleDateString()}</CardTitle>
                                    <CardDescription>{entry.createdAt.toDate().toLocaleTimeString()}</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="capitalize">{entry.mood}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md whitespace-pre-wrap">
                            "{entry.content || entry.transcription}"
                        </p>
                        {entry.reviewed && entry.doctorReport && (
                             <div className="mt-4">
                                <h4 className="font-semibold text-sm mb-1">Doctor's Report:</h4>
                                <p className="text-sm text-muted-foreground p-3 bg-muted/50 border rounded-md whitespace-pre-wrap">{entry.doctorReport}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function UserQuestionnaires({ userId }: { userId: string }) {
    const [submissions, setSubmissions] = useState<QuestionnaireSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'questionnaires'),
            where('userId', '==', userId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionnaireSubmission));
            // Sort manually since we removed orderBy from the query
            subsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setSubmissions(subsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (submissions.length === 0) {
        return <Card className="text-center p-6 md:p-10"><CardTitle>No Questionnaires Submitted</CardTitle><CardDescription className="mt-2">This user has not submitted any screening tools.</CardDescription></Card>;
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {submissions.map(sub => (
                <AccordionItem value={sub.id} key={sub.id} className="border rounded-lg bg-card">
                    <AccordionTrigger className="p-4 hover:no-underline text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                            <FileQuestion className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                                <div className="font-semibold text-sm sm:text-base">{sub.testName}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">{sub.createdAt.toDate().toLocaleString()}</div>
                            </div>
                            <Badge variant="destructive" className="capitalize mt-1 sm:mt-0">{sub.result.level}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t space-y-4">
                        <p><strong>Score:</strong> {sub.score}</p>
                        <p><strong>Initial Assessment:</strong> {sub.result.recommendation}</p>
                        <p><strong>Status:</strong> {sub.reviewed ? `Reviewed` : 'Pending Review'}</p>
                        {sub.doctorFeedback && <p className="p-3 bg-muted rounded-md"><strong>Doctor's Feedback:</strong> {sub.doctorFeedback}</p>}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

function UserMessages({ userId, userProfile }: { userId: string, userProfile: UserProfile | null }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(collection(db, `conversations/${userId}/messages`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await addDoc(collection(db, `conversations/${userId}/messages`), {
            text: newMessage,
            senderId: ADMIN_UID,
            senderName: 'Admin',
            createdAt: serverTimestamp(),
        });
        setNewMessage('');
    };

    return (
        <Card className="flex flex-col h-[70vh]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare />Direct Messages</CardTitle>
                <CardDescription>Communicate directly with {userProfile?.displayName || userProfile?.email}.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="p-4 space-y-4">
                        {isLoading && <Loader2 className="mx-auto w-6 h-6 animate-spin" />}
                        {messages.map(msg => (
                            <div key={msg.id} className={cn('flex items-start gap-3', msg.senderId === ADMIN_UID ? 'justify-end' : 'justify-start')}>
                                {msg.senderId !== ADMIN_UID && <Avatar className="w-8 h-8 border"><AvatarFallback>{userProfile?.displayName?.[0] || 'U'}</AvatarFallback></Avatar>}
                                <div className={cn("flex flex-col max-w-[70%]", msg.senderId === ADMIN_UID ? 'items-end' : 'items-start')}>
                                    <div className={cn('rounded-xl px-4 py-2 text-sm shadow-sm', msg.senderId === ADMIN_UID ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        {msg.text}
                                    </div>
                                </div>
                                {msg.senderId === ADMIN_UID && <Avatar className="w-8 h-8 border"><AvatarFallback>A</AvatarFallback></Avatar>}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardContent>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
                    <Button type="submit" size="icon"><Send className="w-4 h-4" /></Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function UserDetailPage() {
    const { user: adminUser, loading: adminLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        if (!adminLoading && (!adminUser || adminUser.email !== ADMIN_EMAIL)) {
            router.push('/chat');
        }
    }, [adminUser, adminLoading, router]);

    useEffect(() => {
        if (userId) {
            const fetchUserProfile = async () => {
                const userDocRef = doc(db, 'users', userId);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                } else {
                    // Fallback to get email from another collection if profile doesn't exist
                    const q = query(collection(db, 'journalEntries'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(1));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                         setUserProfile({ email: querySnapshot.docs[0].data().userEmail });
                    }
                }
                setIsLoadingProfile(false);
            };
            fetchUserProfile();
        }
    }, [userId]);

    if (adminLoading || isLoadingProfile) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin"><ArrowLeft /></Link>
                    </Button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">User Dashboard</h1>
                        <p className="text-sm text-muted-foreground">{userProfile?.displayName || userProfile?.email || 'Loading...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <Tabs defaultValue="mood-analysis" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="mood-analysis">Mood Analysis</TabsTrigger>
                        <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
                        <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                    </TabsList>
                    <TabsContent value="mood-analysis" className="mt-4">
                        <UserMoodDashboard userId={userId} />
                    </TabsContent>
                    <TabsContent value="journal-entries" className="mt-4">
                        <UserJournalEntries userId={userId} />
                    </TabsContent>
                    <TabsContent value="questionnaires" className="mt-4">
                        <UserQuestionnaires userId={userId} />
                    </TabsContent>
                    <TabsContent value="messages" className="mt-4">
                        <UserMessages userId={userId} userProfile={userProfile} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
