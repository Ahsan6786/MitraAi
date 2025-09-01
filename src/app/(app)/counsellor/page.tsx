'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

export default function CounsellorPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/counsellor-signin');
            return;
        }

        const checkCounsellorStatus = async () => {
            const counsellorDoc = await getDoc(doc(db, 'counsellors', user.uid));
            if (!counsellorDoc.exists() || counsellorDoc.data().status !== 'approved') {
                router.push('/counsellor-signin');
            }
        };

        checkCounsellorStatus();
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2"><UserCheck className="w-6 h-6 text-primary"/>Counsellor Panel</h1>
                        <p className="text-sm text-muted-foreground">Welcome, {user.displayName}</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Dashboard</CardTitle>
                        <CardDescription>This is your dedicated panel. More features will be added soon.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Welcome to the counsellor dashboard. You have been successfully verified and approved.</p>
                    </CardContent>
                 </Card>
            </main>
        </div>
    );
}
