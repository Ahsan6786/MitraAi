
'use client';

import { useState, useEffect } from 'use-strict';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LayoutDashboard, BarChart, LineChart } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, format, parseISO } from 'date-fns';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    mood: string;
}

// Helper function to get the last 7 days for the line chart
const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        dates.push(format(subDays(new Date(), i), 'EEE'));
    }
    return dates;
};

// A simple mapping for mood to a numerical value for the line chart
const moodToValue = (mood: string) => {
    const lowerMood = mood.toLowerCase();
    if (lowerMood.includes('happy') || lowerMood.includes('joyful') || lowerMood.includes('excited')) return 3;
    if (lowerMood.includes('neutral') || lowerMood.includes('calm')) return 2;
    if (lowerMood.includes('sad') || lowerMood.includes('anxious') || lowerMood.includes('angry') || lowerMood.includes('stressed')) return 1;
    return 2; // Default to neutral
};


export default function DashboardPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [moodFrequencyData, setMoodFrequencyData] = useState<any[]>([]);
    const [moodTrendData, setMoodTrendData] = useState<any[]>([]);

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

             // Process data for Mood Trend Chart (Line Chart)
            const last7Days = getLast7Days();
            const trendData = last7Days.map(dayName => ({ name: dayName, mood: 0, entries: 0 }));
            
            const sevenDaysAgo = subDays(new Date(), 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            entries.forEach(entry => {
                const entryDate = entry.createdAt.toDate();
                if (entryDate >= sevenDaysAgo) {
                    const dayName = format(entryDate, 'EEE');
                    const dayData = trendData.find(d => d.name === dayName);
                    if (dayData) {
                        dayData.mood += moodToValue(entry.mood);
                        dayData.entries += 1;
                    }
                }
            });
            
            // Calculate average mood for each day
            const finalTrendData = trendData.map(d => ({
                name: d.name,
                // If no entries, we can show null to create a gap in the line or a default value
                'Average Mood': d.entries > 0 ? parseFloat((d.mood / d.entries).toFixed(2)) : null,
            }));

            setMoodTrendData(finalTrendData);
        }
    }, [entries]);


    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-lg md:text-xl font-bold">Your Wellness Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                      Visualize your mood patterns and track your progress.
                  </p>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 space-y-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : entries.length === 0 ? (
                    <Card className="text-center p-6 md:p-10">
                        <LayoutDashboard className="mx-auto w-12 h-12 text-muted-foreground mb-4"/>
                         <CardTitle>Not Enough Data Yet</CardTitle>
                        <CardDescription className="mt-2 max-w-sm mx-auto">
                            Start adding journal entries to see your personalized mood insights and charts here.
                        </CardDescription>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart className="w-5 h-5 text-primary"/>
                                    Mood Frequency (Last 30 Days)
                                </CardTitle>
                                <CardDescription>This chart shows how often you've felt each mood.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={moodFrequencyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false}/>
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" name="Times Felt" />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LineChart className="w-5 h-5 text-primary"/>
                                    Mood Trend (Last 7 Days)
                                </CardTitle>
                                <CardDescription>
                                    This chart shows your average mood trend. (3=Happy, 2=Neutral, 1=Sad/Anxious)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsLineChart data={moodTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 3]} ticks={[1, 2, 3]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="Average Mood" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
