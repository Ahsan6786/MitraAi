
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp, Timestamp, runTransaction, increment } from 'firebase/firestore';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, CheckCircle2, Trophy } from 'lucide-react';
import { tasksData, Task } from '@/lib/tasks-data';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserTaskStatus {
    [taskId: string]: {
        completed: boolean;
        completedAt?: Timestamp;
        rewarded?: boolean;
    };
}

const TaskCard = ({ task, status, onComplete }: { task: Task, status: { completed: boolean, rewarded: boolean }, onComplete: (task: Task, isNavigating?: boolean) => Promise<void> }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleAction = async () => {
        setIsSubmitting(true);
        if (task.actionUrl) {
            // Mark as complete, then navigate
            await onComplete(task, true);
            router.push(task.actionUrl);
        } else {
            // Just mark as complete
            await onComplete(task);
        }
        setIsSubmitting(false);
    };

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>{task.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="flex items-center gap-2 text-sm font-semibold p-2 bg-muted rounded-md w-fit">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Reward: {task.reward} Tokens</span>
                </div>
            </CardContent>
            <CardFooter>
                {status.rewarded ? (
                    <Button variant="outline" disabled className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        Completed & Rewarded
                    </Button>
                ) : status.completed ? (
                     <Button variant="outline" disabled className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Pending Admin Approval
                    </Button>
                ) : (
                    <Button onClick={handleAction} disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {task.actionUrl ? 'Go to Task' : 'Mark as Completed'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

function RewardsPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [taskStatuses, setTaskStatuses] = useState<UserTaskStatus>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
            const statuses: UserTaskStatus = {};
            snapshot.forEach(doc => {
                statuses[doc.id] = doc.data() as { completed: boolean, rewarded: boolean, completedAt: Timestamp };
            });
            setTaskStatuses(statuses);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleCompleteTask = async (task: Task) => {
        if (!user) return;
        
        const taskRef = doc(db, `users/${user.uid}/tasks`, task.id);

        try {
            // Set the task as completed, awaiting admin review.
            // Rewarded status is not set here.
            await setDoc(taskRef, {
                completed: true,
                completedAt: serverTimestamp(),
                rewarded: false, // Explicitly set rewarded to false
            }, { merge: true });

            toast({
                title: "Task Submitted!",
                description: "An admin will review your task and grant you the tokens shortly."
            });

        } catch (error: any) {
            console.error("Error completing task:", error);
            toast({ title: "Error", description: error.message || "Could not complete the task.", variant: "destructive" });
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Rewards</h1>
                        <p className="text-sm text-muted-foreground">Complete tasks to earn tokens.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <Trophy className="mx-auto w-12 h-12 text-amber-500 mb-4" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Earn Rewards</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Complete the tasks below. An admin will review your submissions and add tokens to your account.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {tasksData.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    status={taskStatuses[task.id] || { completed: false, rewarded: false }} 
                                    onComplete={handleCompleteTask} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function RewardsPage() {
    return (
        <SidebarProvider>
            <RewardsPageContent />
        </SidebarProvider>
    )
}
