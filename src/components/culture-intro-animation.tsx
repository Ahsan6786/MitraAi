
'use client';

import { useEffect, useState } from 'react';
import { LotusIcon } from './icons';
import { cn } from '@/lib/utils';

interface CultureIntroAnimationProps {
    onFinish: () => void;
}

const TOTAL_DURATION = 5000; // 5 seconds total

export default function CultureIntroAnimation({ onFinish }: CultureIntroAnimationProps) {
    const [animationState, setAnimationState] = useState('entering');

     useEffect(() => {
        const finishTimer = setTimeout(() => {
            setAnimationState('exiting');
        }, TOTAL_DURATION - 1000);

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
                @keyframes scale-up {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
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
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 overflow-hidden",
                animationState === 'entering' ? 'opacity-100' : 'opacity-0'
            )}>
                {/* Animated Lotus Icon */}
                <div 
                    className="relative w-24 h-24 text-primary"
                    style={{ animation: 'scale-up 2s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}
                >
                   <LotusIcon className="w-full h-full" />
                </div>

                {/* Text animation */}
                <div className="mt-8 text-center" style={{ animation: 'fade-in-scale-up 1.5s ease-out 1.5s forwards', opacity: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Discover Our Culture</h1>
                    <p className="text-muted-foreground mt-2 text-lg" style={{ animation: 'fade-in 1.5s ease-out 2.5s forwards', opacity: 0 }}>
                        A journey into the heart of India's heritage.
                    </p>
                </div>
            </div>
        </>
    );
}
