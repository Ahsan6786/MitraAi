
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2, Trophy } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Goal {
    id: string;
    text: string;
    completed: boolean;
    createdAt: any;
}

export default function GoalsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newGoal, setNewGoal] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const goalsCollectionRef = user ? collection(db, 'users', user.uid, 'goals') : null;

    useEffect(() => {
        if (!goalsCollectionRef) {
            setIsLoading(false);
            return;
        }

        const q = query(goalsCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const goalsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Goal));
            // Sort by completion status client-side after fetching
            goalsData.sort((a, b) => {
                if (a.completed === b.completed) {
                    return 0; // Keep original (date-based) order if completion is same
                }
                return a.completed ? 1 : -1;
            });
            setGoals(goalsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching goals: ", error);
            toast({ title: "Error", description: "Could not fetch your goals.", variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast, goalsCollectionRef]);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim() || !goalsCollectionRef) return;
        
        setIsAdding(true);
        try {
            await addDoc(goalsCollectionRef, {
                text: newGoal,
                completed: false,
                createdAt: serverTimestamp()
            });
            setNewGoal('');
        } catch (error) {
            console.error("Error adding goal:", error);
            toast({ title: "Error", description: "Could not add your goal.", variant: "destructive" });
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggleGoal = async (goal: Goal) => {
        if (!goalsCollectionRef) return;
        const goalRef = doc(goalsCollectionRef, goal.id);
        await updateDoc(goalRef, { completed: !goal.completed });
    };

    const handleDeleteGoal = async (id: string) => {
        if (!goalsCollectionRef) return;
        const goalRef = doc(goalsCollectionRef, id);
        await deleteDoc(goalRef);
    };

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Your Wellness Goals</h1>
                      <p className="text-sm text-muted-foreground">
                          Set and track small goals for a better week.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Set a New Goal</CardTitle>
                        <CardDescription>What's one small thing you can do for your well-being this week?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddGoal} className="flex gap-2">
                            <Input
                                placeholder="E.g., Practice breathing for 5 mins"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                disabled={isAdding}
                            />
                            <Button type="submit" disabled={isAdding || !newGoal.trim()}>
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span className="hidden sm:inline ml-2">Add</span>
                            </Button>
                        </form>
                    </CardContent>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                <Trophy className="w-12 h-12 mx-auto mb-4" />
                                <p>No goals set yet. Add one above to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {goals.map(goal => (
                                    <div key={goal.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                        <Checkbox
                                            id={`goal-${goal.id}`}
                                            checked={goal.completed}
                                            onCheckedChange={() => handleToggleGoal(goal)}
                                            aria-label={`Mark goal as ${goal.completed ? 'incomplete' : 'complete'}`}
                                        />
                                        <label
                                            htmlFor={`goal-${goal.id}`}
                                            className={cn(
                                                "flex-1 text-sm cursor-pointer",
                                                goal.completed && "line-through text-muted-foreground"
                                            )}
                                        >
                                            {goal.text}
                                        </label>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            aria-label="Delete goal"
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
