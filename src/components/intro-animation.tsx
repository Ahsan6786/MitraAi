
'use client';

import { useEffect, useState } from 'react';
import { LogoPart1, LogoPart2, LogoPart3 } from './icons';
import { cn } from '@/lib/utils';

interface IntroAnimationProps {
    onFinish: () => void;
}

const TOTAL_DURATION = 5000; // 5 seconds total

export default function IntroAnimation({ onFinish }: IntroAnimationProps) {
    const [animationState, setAnimationState] = useState('entering');
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

     useEffect(() => {
        // Preload and play audio
        const audioInstance = new Audio('/intro-sound.mp3');
        audioInstance.play().catch(error => {
            console.warn("Audio autoplay was prevented by the browser.");
        });
        setAudio(audioInstance);

        const finishTimer = setTimeout(() => {
            setAnimationState('exiting');
        }, TOTAL_DURATION - 1000); // Start fade out 1 second before finish

        const unmountTimer = setTimeout(() => {
            onFinish();
        }, TOTAL_DURATION);

        return () => {
            clearTimeout(finishTimer);
            clearTimeout(unmountTimer);
            if (audioInstance) {
                audioInstance.pause();
            }
        };
    }, [onFinish]);


    return (
        <>
            <style jsx global>{`
                @keyframes fly-in-left {
                    from { transform: translateX(-100px) rotate(-90deg); opacity: 0; }
                    to { transform: translateX(0) rotate(0deg); opacity: 1; }
                }
                @keyframes fly-in-right {
                    from { transform: translateX(100px) rotate(90deg); opacity: 0; }
                    to { transform: translateX(0) rotate(0deg); opacity: 1; }
                }
                @keyframes fly-in-top {
                    from { transform: translateY(-50px) scale(0.5); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes fade-in-scale-up {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                 @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

            <div className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000",
                animationState === 'entering' ? 'opacity-100' : 'opacity-0'
            )}>
                {/* Assembling Logo */}
                <div className="relative w-24 h-24 text-primary">
                    <div className="absolute inset-0" style={{ animation: 'fly-in-left 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <LogoPart1 className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0" style={{ animation: 'fly-in-right 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <LogoPart2 className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0" style={{ animation: 'fly-in-top 1.5s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards', opacity: 0 }}>
                        <LogoPart3 className="w-full h-full" />
                    </div>
                </div>

                {/* Text animation */}
                <div className="mt-8 text-center" style={{ animation: 'fade-in-scale-up 1.5s ease-out 1.5s forwards', opacity: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MitraAI</h1>
                    <p className="text-muted-foreground mt-2 text-lg" style={{ animation: 'fade-in 1.5s ease-out 2.5s forwards', opacity: 0 }}>
                        Your Personal Path to Mental Wellness
                    </p>
                </div>
            </div>
        </>
    );
}
