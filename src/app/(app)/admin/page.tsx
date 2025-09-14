
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc, orderBy, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic, PenSquare, ShieldCheck, Sparkles, AlertTriangle, FileQuestion, UserPlus, Mail, Phone, Check, X, Trash2, Users, ArrowRight, Coins } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDoctorReport } from '@/ai/flows/generate-doctor-report';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/alert-dialog"
import { GenZToggle } from '@/components/genz-toggle';
import Link from 'next/link';
import { SOSButton } from '@/components/sos-button';


const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    type: 'text' | 'voice';
    mood: string;
    content?: string;
    transcription?: string;
    userId: string;
    userEmail: string;
    reviewed: boolean;
}

interface QuestionnaireSubmission {
    id: string;
    createdAt: Timestamp;
    userEmail: string;
    testName: string;
    score: number;
    result: {
        level: string;
        recommendation: string;
    };
    answers: Record<string, string>;
    reviewed: boolean;
}

interface Counsellor {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

interface AppUser {
    id: string;
    email: string;
    displayName?: string;
    tokens?: number;
}

const questionnaireQuestions = [
    { id: 1, text: "Are you basically satisfied with your life?" },
    { id: 2, text: "Have you dropped many of your activities and interests?" },
    { id: 3, text: "Do you feel that your life is empty?" },
    { id: 4, text: "Do you often get bored?" },
    { id: 5, text: "Are you in good spirits most of the time?" },
    { id: 6, text: "Are you afraid that something bad is going to happen to you?" },
    { id: 7, text: "Do you feel happy most of the time?" },
    { id: 8, text: "Do you often feel helpless?" },
    { id: 9, text: "Do you prefer to stay at home, rather than going out and doing new things?" },
    { id: 10, text: "Do you feel you have more problems with memory than most?" },
    { id: 11, text: "Do you think it is wonderful to be alive now?" },
    { id: 12, text: "Do you feel pretty worthless the way you are now?" },
    { id: 13, text: "Do you feel full of energy?" },
    { id: 14, text: "Do you feel that your situation is hopeless?" },
    { id: 15, text: "Do you think that most people are better off than you are?" }
];


function CounsellorRequests() {
    const [requests, setRequests] = useState<Counsellor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'counsellors'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Counsellor)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApproval = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'counsellors', id), { status: newStatus });
            toast({ title: `Counsellor ${newStatus}.` });
        } catch (error) {
            toast({ title: 'Update failed.', variant: 'destructive' });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (requests.length === 0) return <Card className="text-center p-6 md:p-10"><CardTitle>No Pending Requests</CardTitle><CardDescription className="mt-2">There are no new counsellor applications to review.</CardDescription></Card>;

    return (
        <div className="space-y-4">
            {requests.map(req => (
                <Card key={req.id}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="w-5 h-5"/>{req.name}</CardTitle>
                            <div className="text-xs text-muted-foreground">{req.createdAt.toDate().toLocaleDateString()}</div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                         <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /><span>{req.email}</span></div>
                         <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>{req.phone}</span></div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproval(req.id, 'approved')}><Check className="w-4 h-4 mr-2"/>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApproval(req.id, 'rejected')}><X className="w-4 h-4 mr-2"/>Reject</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

function ManageCounsellors() {
    const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'counsellors'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCounsellors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Counsellor)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'counsellors', id));
            toast({ title: 'Counsellor Removed' });
        } catch (error) {
            console.error('Error deleting counsellor:', error);
            toast({ title: 'Deletion failed.', variant: 'destructive' });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (counsellors.length === 0) return <Card className="text-center p-6 md:p-10"><CardTitle>No Approved Counsellors</CardTitle><CardDescription className="mt-2">There are no approved counsellors to display.</CardDescription></Card>;

    return (
        <div className="space-y-4">
            {counsellors.map(c => (
                <Card key={c.id}>
                    <CardHeader>
                         <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="w-5 h-5"/>{c.name}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground pt-1">{c.createdAt.toDate().toLocaleDateString()}</CardDescription>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the counsellor and all their data. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                         <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /><span>{c.email}</span></div>
                         <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>{c.phone}</span></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ManageUsers() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                // Fetch all user profiles from the 'users' collection
                const usersQuery = await getDocs(collection(db, 'users'));
                
                const userList = usersQuery.docs.map(doc => ({
                    id: doc.id,
                    email: doc.data().email || 'No email',
                    displayName: doc.data().displayName,
                    tokens: doc.data().tokens
                } as AppUser));

                setUsers(userList);

            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (users.length === 0) return <Card className="text-center p-6 md:p-10"><CardTitle>No Users Found</CardTitle><CardDescription className="mt-2">There are no user profiles in the database yet.</CardDescription></Card>;

    return (
        <div className="space-y-4">
            {users.map(user => (
                <Card key={user.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{user.displayName || 'No name set'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2 text-sm font-semibold p-2 bg-muted rounded-md">
                                <Coins className="w-4 h-4 text-amber-500" />
                                <span>{user.tokens ?? 0}</span>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/user/${user.id}`}>
                                    View Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push(user ? '/chat' : '/signin');
        }
    }, [user, loading, router]);

    if (loading || !user || user.email !== ADMIN_EMAIL) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary"/>Admin Panel</h1>
                        <p className="text-sm text-muted-foreground">Review user submissions and requests.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <Tabs defaultValue="manage-users" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
                        <TabsTrigger value="counsellor-requests">Counsellor Requests</TabsTrigger>
                        <TabsTrigger value="manage-counsellors">Manage Counsellors</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manage-users" className="mt-4">
                        <ManageUsers />
                    </TabsContent>
                    <TabsContent value="counsellor-requests" className="mt-4">
                        <CounsellorRequests />
                    </TabsContent>
                     <TabsContent value="manage-counsellors" className="mt-4">
                        <ManageCounsellors />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

    