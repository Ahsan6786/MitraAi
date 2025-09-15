
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDocs, doc, getDoc, limit, addDoc, serverTimestamp, updateDoc, increment, runTransaction, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart, LineChart, FileQuestion, ArrowLeft, PenSquare, Mic, Send, MessageSquare, Coins, Trophy, CheckCircle2, CircleDot, Hourglass, RotateCcw } from 'lucide-react';
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
import { SOSButton } from '@/components/sos-button';
import { useToast } from '@/hooks/use-toast';
import { tasksData, Task } from '@/lib/tasks-data';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';
const ADMIN_UID = 'ADMIN'; // A special UID for the admin/doctor
const DAILY_LIMIT_SECONDS = 3600;

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
    tokens?: number;
}

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}

interface UserTask {
    id: string; // This will be the task ID from tasks-data.ts
    completed: boolean;
    completedAt: Timestamp;
    rewarded?: boolean;
}

interface DailyUsage {
    timeSpentSeconds: number;
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

function AdminActions({ userId, userProfile }: { userId: string; userProfile: UserProfile | null }) {
    const [tokenAmount, setTokenAmount] = useState('');
    const [usageAmount, setUsageAmount] = useState('');
    const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        if (!userId) return;
        const todayId = format(new Date(), 'yyyy-MM-dd');
        const usageDocRef = doc(db, `users/${userId}/dailyUsage`, todayId);
        const unsubscribe = onSnapshot(usageDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setDailyUsage(docSnap.data() as DailyUsage);
            } else {
                setDailyUsage({ timeSpentSeconds: 0 });
            }
        });
        return () => unsubscribe();
    }, [userId]);

    const handleUpdateTokens = async (action: 'add' | 'set') => {
        const amount = parseInt(tokenAmount, 10);
        if (isNaN(amount) || amount < 0) {
            toast({ title: 'Invalid amount', variant: 'destructive' });
            return;
        }

        setIsLoading(prev => ({ ...prev, tokens: true }));
        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
                tokens: action === 'add' ? increment(amount) : amount
            });
            toast({ title: 'Success', description: `User tokens have been updated.` });
            setTokenAmount('');
        } catch (error) {
            console.error('Error updating tokens:', error);
            toast({ title: 'Error', description: 'Could not update tokens.', variant: 'destructive' });
        } finally {
            setIsLoading(prev => ({ ...prev, tokens: false }));
        }
    };
    
    const handleUpdateUsage = async () => {
        const minutesToAdd = parseInt(usageAmount, 10);
        if (isNaN(minutesToAdd) || minutesToAdd <= 0) {
            toast({ title: 'Invalid amount', variant: 'destructive' });
            return;
        }

        setIsLoading(prev => ({ ...prev, usage: true }));
        const secondsToAdd = minutesToAdd * 60;
        const todayId = format(new Date(), 'yyyy-MM-dd');
        const usageDocRef = doc(db, `users/${userId}/dailyUsage`, todayId);

        try {
            // Decrement the time spent, effectively adding time to their limit.
            await setDoc(usageDocRef, {
                timeSpentSeconds: increment(-secondsToAdd)
            }, { merge: true });

            toast({ title: 'Usage Time Added', description: `${minutesToAdd} minutes have been added to the user's daily limit.` });
            setUsageAmount('');
        } catch (error) {
            console.error('Error updating usage:', error);
            toast({ title: 'Error', description: 'Could not update usage time.', variant: 'destructive' });
        } finally {
            setIsLoading(prev => ({ ...prev, usage: false }));
        }
    };
    
    const handleResetUsage = async () => {
        setIsLoading(prev => ({ ...prev, resetUsage: true }));
        const todayId = format(new Date(), 'yyyy-MM-dd');
        const usageDocRef = doc(db, `users/${userId}/dailyUsage`, todayId);
        try {
            await setDoc(usageDocRef, { timeSpentSeconds: 0 });
            toast({ title: 'Usage Reset', description: "User's daily usage has been reset to zero." });
        } catch (error) {
            console.error('Error resetting usage:', error);
            toast({ title: 'Error', description: 'Could not reset usage.', variant: 'destructive' });
        } finally {
            setIsLoading(prev => ({ ...prev, resetUsage: false }));
        }
    };
    
    const timeSpent = dailyUsage?.timeSpentSeconds ?? 0;
    const minutesSpent = Math.floor(timeSpent / 60);
    const minutesLeft = Math.max(0, Math.floor((DAILY_LIMIT_SECONDS - timeSpent) / 60));


    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Token Management */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Token Management</h3>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary"/>
                            <p className="font-semibold">Current User Tokens:</p>
                        </div>
                        <p className="font-bold text-lg">{userProfile?.tokens ?? 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            placeholder="Amount" 
                            value={tokenAmount} 
                            onChange={(e) => setTokenAmount(e.target.value)}
                            disabled={isLoading.tokens}
                        />
                        <Button onClick={() => handleUpdateTokens('add')} disabled={isLoading.tokens}>
                            {isLoading.tokens && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Add
                        </Button>
                         <Button onClick={() => handleUpdateTokens('set')} disabled={isLoading.tokens} variant="outline">
                            {isLoading.tokens && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Set
                        </Button>
                    </div>
                </div>

                {/* Usage Management */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Daily Usage Management</h3>
                     <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                            <Hourglass className="w-5 h-5 text-primary"/>
                            <p className="font-semibold">Time Spent Today:</p>
                        </div>
                        <p className="font-bold text-lg">{minutesSpent} / {DAILY_LIMIT_SECONDS / 60} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            placeholder="Minutes to add" 
                            value={usageAmount} 
                            onChange={(e) => setUsageAmount(e.target.value)} 
                            disabled={isLoading.usage}
                        />
                        <Button onClick={handleUpdateUsage} disabled={isLoading.usage}>
                            {isLoading.usage && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Add Time
                        </Button>
                    </div>
                     <Button onClick={handleResetUsage} disabled={isLoading.resetUsage} variant="destructive" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Daily Usage to 0
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function UserTasks({ userId }: { userId: string }) {
    const [userTasks, setUserTasks] = useState<UserTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        const tasksQuery = query(collection(db, `users/${userId}/tasks`));
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserTask));
            allTasks.sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());
            setUserTasks(allTasks);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);
    
    const handleGrantReward = async (task: UserTask) => {
        setIsSubmitting(prev => ({...prev, [task.id]: true}));
        
        const taskData = tasksData.find(t => t.id === task.id);
        if (!taskData) {
            toast({ title: 'Task data not found.', variant: 'destructive' });
            setIsSubmitting(prev => ({...prev, [task.id]: false}));
            return;
        }

        const userRef = doc(db, 'users', userId);
        const taskRef = doc(db, `users/${userId}/tasks`, task.id);

        try {
            await runTransaction(db, async (transaction) => {
                const taskDoc = await transaction.get(taskRef);
                if (taskDoc.exists() && taskDoc.data().rewarded) {
                    throw new Error("Task already rewarded.");
                }

                transaction.update(userRef, { tokens: increment(taskData.reward) });
                transaction.update(taskRef, { rewarded: true });
            });

            toast({ title: 'Reward Granted!', description: `${taskData.reward} tokens added to the user.` });
        } catch (error: any) {
            console.error('Error granting reward:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(prev => ({...prev, [task.id]: false}));
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const completedTasks = userTasks.filter(t => t.completed);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy />Completed Tasks</CardTitle>
                <CardDescription>Review and reward the tasks completed by the user.</CardDescription>
            </CardHeader>
            <CardContent>
                {completedTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">This user has not completed any tasks yet.</p>
                ) : (
                    <div className="space-y-3">
                        {completedTasks.map(task => {
                            const taskData = tasksData.find(t => t.id === task.id);
                            if (!taskData) return null;
                            const isTaskSubmitting = isSubmitting[task.id];
                            return (
                                <div key={task.id} className="p-3 bg-muted rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{taskData.title}</p>
                                        <p className="text-xs text-muted-foreground">Completed on: {task.completedAt.toDate().toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Coins className="w-3 h-3 text-amber-500" /> +{taskData.reward}
                                        </Badge>
                                        {task.rewarded ? (
                                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Rewarded</span>
                                            </div>
                                        ) : (
                                            <Button size="sm" onClick={() => handleGrantReward(task)} disabled={isTaskSubmitting}>
                                                {isTaskSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Approve & Grant Reward
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
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
                            <div key={msg.id} className={cn('flex items-start gap-3', msg.senderId === ADMIN_UID ? 'justify-start' : 'justify-end')}>
                                {msg.senderId === ADMIN_UID && <Avatar className="w-8 h-8 border"><AvatarFallback>A</AvatarFallback></Avatar>}
                                <div className={cn("flex flex-col max-w-[70%]", msg.senderId === ADMIN_UID ? 'items-start' : 'items-end')}>
                                    <div className={cn('rounded-xl px-4 py-2 text-sm shadow-sm', msg.senderId === ADMIN_UID ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                        {msg.text}
                                    </div>
                                </div>
                                {msg.senderId !== ADMIN_UID && <Avatar className="w-8 h-8 border"><AvatarFallback>{userProfile?.displayName?.[0] || 'U'}</AvatarFallback></Avatar>}
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
            const userDocRef = doc(db, 'users', userId);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                 if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                } else {
                    // Fallback to get email from another collection if profile doesn't exist
                    const q = query(collection(db, 'journalEntries'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(1));
                    getDocs(q).then(querySnapshot => {
                        if (!querySnapshot.empty) {
                             setUserProfile({ email: querySnapshot.docs[0].data().userEmail });
                        }
                    });
                }
                setIsLoadingProfile(false);
            });
            return () => unsubscribe();
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
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <Tabs defaultValue="actions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="mood-analysis">Mood Analysis</TabsTrigger>
                        <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
                        <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                    </TabsList>
                    <TabsContent value="actions" className="mt-4">
                        <AdminActions userId={userId} userProfile={userProfile} />
                    </TabsContent>
                     <TabsContent value="tasks" className="mt-4">
                        <UserTasks userId={userId} />
                    </TabsContent>
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
