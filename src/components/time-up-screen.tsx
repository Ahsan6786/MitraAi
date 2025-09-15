
'use client';

import { Clock, Moon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from './ui/button';

export default function TimeUpScreen() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <Clock className="w-24 h-24 text-primary" />
                        <Moon className="w-8 h-8 text-secondary-foreground absolute bottom-1 right-1 bg-background rounded-full p-1" />
                    </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Time's Up for Today!</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    You've used your one hour for today. This is a great step towards maintaining a healthy balance with technology.
                </p>
                <p className="mt-4 text-muted-foreground">
                    Please come back tomorrow to continue your journey. Rest and recharge!
                </p>
                <Button onClick={() => signOut(auth)} className="mt-8">
                    Sign Out & Take a Break
                </Button>
            </div>
        </div>
    );
}
