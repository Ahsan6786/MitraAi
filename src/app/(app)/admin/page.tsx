'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/chat');
        }
    }, [user, loading, isAdmin, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-4">
                <h1 className="text-xl font-bold font-headline">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Review user journal entries.</p>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome, Admin!</CardTitle>
                        <CardDescription>
                            This is the central hub for reviewing and managing user journal entries. Use this panel to gain insights and provide guidance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Journal entries will be displayed here.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
