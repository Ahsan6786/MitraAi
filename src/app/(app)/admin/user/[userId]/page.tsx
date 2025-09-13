
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart, LineChart, FileQuestion, ArrowLeft } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    mood: string;
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

function UserQuestionnaires({ userId }: { userId: string }) {
    const [submissions, setSubmissions] = useState<QuestionnaireSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'questionnaires'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionnaireSubmission));
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
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="mood-analysis">Mood Analysis</TabsTrigger>
                        <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
                    </TabsList>
                    <TabsContent value="mood-analysis" className="mt-4">
                        <UserMoodDashboard userId={userId} />
                    </TabsContent>
                    <TabsContent value="questionnaires" className="mt-4">
                        <UserQuestionnaires userId={userId} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
