
'use client';

import { useEffect, useState } from 'react';
import { LogoPart1, LogoPart2, LogoPart3 } from './icons';
import { cn } from '@/lib/utils';

interface IntroAnimationProps {
    onFinish: () => void;
}

const TOTAL_DURATION = 2500; // 2.5 seconds total

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
        }, TOTAL_DURATION - 500); // Start fade out before finish

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
                 @keyframes slow-fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 overflow-hidden",
                animationState === 'entering' ? 'opacity-100' : 'opacity-0'
            )}>
                {/* Mountain Reflection Background */}
                <div 
                    className="absolute bottom-0 left-0 w-full h-1/2 text-foreground/5"
                    style={{ animation: 'slow-fade-in-up 1s ease-out 0.5s forwards', opacity: 0 }}
                >
                    <svg
                        className="w-full h-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 1440 320"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="mountainGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                                <stop offset="0%" stopOpacity="0.5" stopColor="currentColor" />
                                <stop offset="100%" stopOpacity="0" stopColor="currentColor" />
                            </linearGradient>
                        </defs>
                        <path
                            fill="url(#mountainGradient)"
                            d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,208C672,203,768,149,864,117.3C960,85,1056,75,1152,90.7C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        ></path>
                    </svg>
                </div>


                {/* Assembling Logo */}
                <div className="relative w-24 h-24 text-primary">
                    <div className="absolute inset-0" style={{ animation: 'fly-in-left 1s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <LogoPart1 className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0" style={{ animation: 'fly-in-right 1s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                        <LogoPart2 className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0" style={{ animation: 'fly-in-top 1s cubic-bezier(0.25, 1, 0.5, 1) 0.25s forwards', opacity: 0 }}>
                        <LogoPart3 className="w-full h-full" />
                    </div>
                </div>

                {/* Text animation */}
                <div className="mt-8 text-center" style={{ animation: 'fade-in-scale-up 1s ease-out 1s forwards', opacity: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MitraAI</h1>
                    <p className="text-muted-foreground mt-2 text-lg" style={{ animation: 'fade-in 1s ease-out 1.5s forwards', opacity: 0 }}>
                        Your Personal Path to Mental Wellness
                    </p>
                </div>
            </div>
        </>
    );
}
