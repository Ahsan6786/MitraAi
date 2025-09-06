
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Bot, MapPin, Edit } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { GenZToggle } from '@/components/genz-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allIndianStates } from '@/lib/states-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function ProfilePage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState('');
    const [companionName, setCompanionName] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoPreview(user.photoURL);
            const fetchProfileData = async () => {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCompanionName(data.companionName || '');
                    setState(data.state || '');
                    setCity(data.city || '');
                }
                setIsLoadingData(false);
            };
            fetchProfileData();
        } else if (!loading) {
            setIsLoadingData(false);
        }
    }, [user, loading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!displayName.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            let photoURL = user.photoURL;

            // 1. Upload new photo if one is selected
            if (photoFile) {
                const filePath = `profile-pictures/${user.uid}/${photoFile.name}`;
                const storageRef = ref(storage, filePath);
                const snapshot = await uploadBytes(storageRef, photoFile);
                photoURL = await getDownloadURL(snapshot.ref);
            }

            // 2. Update Auth profile
            await updateProfile(user, { displayName, photoURL });
            
            // 3. Update Firestore user data
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { 
                companionName: companionName.trim(),
                state: state.trim(),
                city: city.trim(),
                displayName: displayName.trim(),
                email: user.email,
                photoURL: photoURL
            }, { merge: true });

            toast({ title: "Profile Updated", description: "Your changes have been successfully saved." });
            setPhotoFile(null); // Reset file input after successful upload
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

    const userAvatarFallback = user?.displayName?.[0] || user?.email?.[0] || 'U';

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
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Avatar className="w-24 h-24 border-2 border-primary/50">
                                        <AvatarImage src={photoPreview || undefined} />
                                        <AvatarFallback className="text-3xl">{userAvatarFallback.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Edit className="w-4 h-4"/>
                                        <span className="sr-only">Change profile picture</span>
                                    </Button>
                                    <Input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden" 
                                        accept="image/png, image/jpeg"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

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
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        State
                                    </Label>
                                    <Select onValueChange={setState} value={state} disabled={isSubmitting}>
                                        <SelectTrigger id="state">
                                            <SelectValue placeholder="Select your state" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allIndianStates.filter(s => s.id !== 'india').map(s => (
                                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        City
                                    </Label>
                                    <Input
                                        id="city"
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Enter your city"
                                        disabled={isSubmitting}
                                    />
                                </div>
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
                             <Button type="submit" disabled={isSubmitting} className="w-full">
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
