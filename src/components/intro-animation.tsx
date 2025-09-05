
'use client';

import { useEffect, useState } from 'react';
import { Logo } from './icons';
import { cn } from '@/lib/utils';

interface IntroAnimationProps {
    onFinish: () => void;
}

const TOTAL_DURATION = 8000; // 8 seconds total

export default function IntroAnimation({ onFinish }: IntroAnimationProps) {
    const [animationState, setAnimationState] = useState('entering');

    useEffect(() => {
        const finishTimer = setTimeout(() => {
            setAnimationState('exiting');
        }, TOTAL_DURATION - 1000); // Start fade out 1 second before finish

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
                @keyframes fly-in-1 {
                    from { transform: translate(-100vw, -100vh) rotate(-360deg); opacity: 0; }
                    to { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                }
                @keyframes fly-in-2 {
                    from { transform: translate(100vw, -100vh) rotate(360deg); opacity: 0; }
                    to { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                }
                @keyframes fly-in-3 {
                    from { transform: translate(-100vw, 100vh) rotate(360deg); opacity: 0; }
                    to { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                }
                @keyframes fly-in-4 {
                    from { transform: translate(100vw, 100vh) rotate(-360deg); opacity: 0; }
                    to { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fade-in-scale-up {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>

            <div className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000",
                animationState === 'entering' ? 'opacity-100' : 'opacity-0'
            )}>
                {/* Logo formed by pieces */}
                <div className="relative w-24 h-24 text-primary">
                    {/* Top-left piece of the logo */}
                    <div className="absolute top-0 left-0 w-12 h-12 overflow-hidden" style={{ animation: 'fly-in-1 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <Logo className="absolute -top-1 -left-1 w-24 h-24" />
                    </div>
                    {/* Top-right piece */}
                    <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden" style={{ animation: 'fly-in-2 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <Logo className="absolute -top-1 -right-11 w-24 h-24" />
                    </div>
                    {/* Bottom-left piece */}
                    <div className="absolute bottom-0 left-0 w-12 h-12 overflow-hidden" style={{ animation: 'fly-in-3 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <Logo className="absolute -bottom-11 -left-1 w-24 h-24" />
                    </div>
                    {/* Bottom-right piece */}
                    <div className="absolute bottom-0 right-0 w-12 h-12 overflow-hidden" style={{ animation: 'fly-in-4 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <Logo className="absolute -bottom-11 -right-11 w-24 h-24" />
                    </div>
                </div>

                {/* Text animation */}
                <div className="mt-8 text-center" style={{ animation: 'fade-in-scale-up 2s ease-out 2s forwards', opacity: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MitraAI</h1>
                    <p className="text-muted-foreground mt-2 text-lg" style={{ animation: 'fade-in 1.5s ease-out 4s forwards', opacity: 0 }}>
                        Your Personal Path to Mental Wellness
                    </p>
                </div>
            </div>
        </>
    );
}
