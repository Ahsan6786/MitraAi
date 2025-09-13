
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { statesData, allIndianStates } from '@/lib/states-data';
import { cn } from '@/lib/utils';
import { GenZToggle } from '@/components/genz-toggle';
import CultureIntroAnimation from '@/components/culture-intro-animation';
import { SOSButton } from '@/components/sos-button';

// Simple hash function to generate a color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

// A slightly different hash function for the second gradient color
const stringToColor2 = (str: string) => {
    let hash = 5381; // Different seed
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};


function CulturePageContent() {
    const availableStateIds = new Set(statesData.map(s => s.id));

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Our Culture</h1>
                        <p className="text-sm text-muted-foreground">Explore the rich heritage of India.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Explore India's Diversity</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Select a state to discover its unique culture, traditions, and beauty.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {allIndianStates.map(state => {
                            const isAvailable = availableStateIds.has(state.id);
                            const color1 = `#${stringToColor(state.name)}`;
                            const color2 = `#${stringToColor2(state.name)}`;
                            
                            const cardContent = (
                                <Card className={cn(
                                    "group overflow-hidden transition-all duration-300 rounded-lg",
                                    isAvailable ? "hover:shadow-lg hover:-translate-y-1" : "opacity-50 cursor-not-allowed"
                                )}>
                                    <CardContent className="p-0">
                                        <div 
                                            className="relative aspect-[4/3] w-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-lg"
                                            style={{ background: `linear-gradient(45deg, ${color1}, ${color2})` }}
                                        >
                                            <div className="absolute inset-0 bg-black/20"></div>
                                            <h3 className="relative text-white text-base font-bold text-center p-2">{state.name}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            );

                            if (isAvailable) {
                                return (
                                    <Link key={state.id} href={`/culture/${state.id}`} className="block">
                                        {cardContent}
                                    </Link>
                                );
                            }
                            
                            return <div key={state.id}>{cardContent}</div>;
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CulturePage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        setIsClient(true);
        const hasSeenIntro = sessionStorage.getItem('hasSeenCultureIntro');
        if (hasSeenIntro) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem('hasSeenCultureIntro', 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null; // Render nothing on the server to avoid hydration mismatch
    }
    
    if (showIntro) {
        return <CultureIntroAnimation onFinish={handleIntroFinish} />;
    }

    return <CulturePageContent />;
}
