
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Bot } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { GenZToggle } from '@/components/genz-toggle';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState('');
    const [companionName, setCompanionName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            const fetchProfileData = async () => {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setCompanionName(docSnap.data().companionName || '');
                }
                setIsLoadingData(false);
            };
            fetchProfileData();
        } else if (!loading) {
            setIsLoadingData(false);
        }
    }, [user, loading]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!displayName.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Update Auth display name
            await updateProfile(user, { displayName });
            
            // Update Firestore companion name
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { companionName: companionName.trim() }, { merge: true });

            toast({ title: "Profile Updated", description: "Your changes have been successfully saved." });
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isLoadingData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Your Profile</h1>
                        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
                <Card className="w-full max-w-lg">
                    <form onSubmit={handleUpdateProfile}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               <User className="w-6 h-6 text-primary"/>
                               Account Information
                            </CardTitle>
                            <CardDescription>Update your personal and companion settings below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={user?.email || ''} disabled />
                                <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your name"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companionName" className="flex items-center gap-2">
                                    <Bot className="w-4 h-4" />
                                    AI Companion Name
                                </Label>
                                <Input
                                    id="companionName"
                                    type="text"
                                    value={companionName}
                                    onChange={(e) => setCompanionName(e.target.value)}
                                    placeholder="e.g., Mitra"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-muted-foreground">Give your AI companion a custom name.</p>
                            </div>
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </main>
        </div>
    );
}
