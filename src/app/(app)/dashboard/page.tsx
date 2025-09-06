
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart, LineChart, LayoutDashboard } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    mood: string;
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

function DashboardPageContent() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [moodFrequencyData, setMoodFrequencyData] = useState<any[]>([]);
    const [moodTrendData7, setMoodTrendData7] = useState<any[]>([]);
    const [moodTrendData30, setMoodTrendData30] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            const thirtyDaysAgo = subDays(new Date(), 30);
            const q = query(
                collection(db, 'journalEntries'),
                where('userId', '==', user.uid),
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
        } else {
             setIsLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        if (entries.length > 0) {
            // Process data for Mood Frequency Chart (Bar Chart)
            const moodCounts = entries.reduce((acc, entry) => {
                const mood = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
                acc[mood] = (acc[mood] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const frequencyData = Object.keys(moodCounts).map(mood => ({
                name: mood,
                count: moodCounts[mood],
            }));
            setMoodFrequencyData(frequencyData);

            // --- Process data for Mood Trend Chart (Line Chart) ---
            const processTrendData = (days: number) => {
                const interval = eachDayOfInterval({
                    start: subDays(new Date(), days - 1),
                    end: new Date()
                });

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


    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Your Wellness Dashboard</h1>
                      <p className="text-sm text-muted-foreground">
                          Visualize your mood patterns and track your progress.
                      </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 space-y-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <Card className="text-center p-6 md:p-10 w-full max-w-lg">
                            <LineChart className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                             <CardTitle>Not Enough Data Yet</CardTitle>
                            <CardDescription className="mt-2 max-w-sm mx-auto">
                                Start adding journal entries to see your personalized mood insights and charts here.
                            </CardDescription>
                        </Card>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="text-slate-800 dark:text-slate-200 text-3xl md:text-4xl font-bold leading-tight">Mood Tracking</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal mt-2 max-w-2xl mx-auto">Visualize your emotional patterns over time. Understanding your mood is the first step towards a healthier mind.</p>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <Tabs defaultValue="weekly">
                                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                                        <CardTitle>Your Mood Overview</CardTitle>
                                        <TabsList className="grid grid-cols-2 w-full sm:w-auto mt-4 sm:mt-0">
                                            <TabsTrigger value="weekly">7 Days</TabsTrigger>
                                            <TabsTrigger value="monthly">30 Days</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <TabsContent value="weekly">
                                        <div className="w-full h-96">
                                            <ResponsiveContainer>
                                                <RechartsLineChart data={moodTrendData7} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" />
                                                    <YAxis domain={[0.5, 5.5]} ticks={[1,2,3,4,5]} tickFormatter={valueToEmoji} width={50} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'hsl(var(--background))',
                                                            borderColor: 'hsl(var(--border))'
                                                        }}
                                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                    />
                                                    <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls fill="hsl(var(--primary) / 0.1)" />
                                                </RechartsLineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="monthly">
                                         <div className="w-full h-96">
                                             <ResponsiveContainer>
                                                <RechartsLineChart data={moodTrendData30} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                                    <YAxis domain={[0.5, 5.5]} ticks={[1,2,3,4,5]} tickFormatter={valueToEmoji} width={50} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'hsl(var(--background))',
                                                            borderColor: 'hsl(var(--border))'
                                                        }}
                                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                    />
                                                    <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls dot={false} />
                                                </RechartsLineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart className="w-5 h-5 text-primary"/>
                                    Mood Frequency
                                </CardTitle>
                                <CardDescription>This chart shows how often you've felt each mood in the last 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={moodFrequencyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false}/>
                                        <Tooltip 
                                            cursor={{fill: 'hsl(var(--accent))'}}
                                            contentStyle={{
                                                background: 'hsl(var(--background))',
                                                borderColor: 'hsl(var(--border))'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" name="Times Felt" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}

export default function DashboardPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenDashboardIntro';

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
            icon={<LayoutDashboard className="w-full h-full" />}
            title="Dashboard"
            subtitle="Visualize your mood patterns."
        />;
    }

    return <DashboardPageContent />;
}
