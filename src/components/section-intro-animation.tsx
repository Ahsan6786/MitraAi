
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SectionIntroAnimationProps {
    onFinish: () => void;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}

const TOTAL_DURATION = 4000; // 4 seconds total

export default function SectionIntroAnimation({ onFinish, icon, title, subtitle }: SectionIntroAnimationProps) {
    const [animationState, setAnimationState] = useState('entering');

     useEffect(() => {
        const finishTimer = setTimeout(() => {
            setAnimationState('exiting');
        }, TOTAL_DURATION - 500);

        const unmountTimer = setTimeout(() => {
            onFinish();
        }, TOTAL_DURATION);

        return () => {
            clearTimeout(finishTimer);
            clearTimeout(unmountTimer);
        };
    }, [onFinish]);


    return (
        <>
            <style jsx global>{`
                @keyframes scale-up-fade {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 overflow-hidden",
                animationState === 'entering' ? 'opacity-100' : 'opacity-0'
            )}>
                {/* Animated Icon */}
                <div 
                    className="relative w-24 h-24 text-primary"
                    style={{ animation: 'scale-up-fade 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}
                >
                   {icon}
                </div>

                {/* Text animation */}
                <div className="mt-8 text-center" style={{ animation: 'fade-in-up 1s ease-out 0.5s forwards', opacity: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground mt-2 text-lg" style={{ animation: 'fade-in-up 1s ease-out 1s forwards', opacity: 0 }}>
                        {subtitle}
                    </p>
                </div>
            </div>
        </>
    );
}
