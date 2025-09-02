'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const stages = [
  { name: 'Breathe In', duration: 4 },
  { name: 'Hold', duration: 4 },
  { name: 'Breathe Out', duration: 4 },
  { name: 'Hold', duration: 4 },
];

function BoxBreathingVisualizer({ stageIndex, countdown, isActive }: { stageIndex: number, countdown: number, isActive: boolean }) {
  const currentStageName = stages[stageIndex].name;
  
  // Opacity logic for labels
  const getLabelOpacity = (name: string) => (isActive && currentStageName === name) ? 'opacity-100' : 'opacity-50';

  return (
    <div className="flex h-80 w-full items-center justify-center rounded-lg bg-background/50">
        <div className="relative flex h-64 w-64 items-center justify-center">
            {/* Dashed circle */}
            <div className="absolute h-full w-full rounded-full border-2 border-dashed border-muted-foreground/50"></div>
            
            {/* Animated dot */}
            <div 
              className={cn(
                "h-16 w-16 rounded-full bg-primary transition-transform duration-2000 ease-in-out",
                isActive && "animate-breathe"
              )}
            ></div>
            
            {/* Labels */}
            <div className={cn("absolute top-0 flex flex-col items-center transition-opacity", getLabelOpacity('Breathe In'))}>
                <span className="text-sm font-medium text-muted-foreground">Breathe In</span>
                <span className="text-2xl font-bold">{currentStageName === 'Breathe In' ? countdown : '4'}s</span>
            </div>
            <div className={cn("absolute right-0 flex flex-col items-center transition-opacity -rotate-90", getLabelOpacity('Hold'))}>
                <span className="text-sm font-medium text-muted-foreground">Hold</span>
                <span className="text-2xl font-bold">{stages[(stageIndex + 3) % 4].name === 'Hold' && currentStageName === 'Hold' ? countdown : '4'}s</span>
            </div>
            <div className={cn("absolute bottom-0 flex flex-col items-center transition-opacity", getLabelOpacity('Breathe Out'))}>
                <span className="text-sm font-medium text-muted-foreground">Breathe Out</span>
                <span className="text-2xl font-bold">{currentStageName === 'Breathe Out' ? countdown : '4'}s</span>
            </div>
             <div className={cn("absolute left-0 flex flex-col items-center transition-opacity rotate-90", getLabelOpacity('Hold'))}>
                <span className="text-sm font-medium text-muted-foreground">Hold</span>
                <span className="text-2xl font-bold">{stages[(stageIndex + 1) % 4].name === 'Hold' && currentStageName === 'Hold' ? countdown : '4'}s</span>
            </div>
        </div>
    </div>
  );
}


function BoxBreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(stages[0].duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev > 1) {
            return prev - 1;
          } else {
            setStageIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % stages.length;
              setCountdown(stages[nextIndex].duration);
              return nextIndex;
            });
            return 0; 
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleStartPause = () => setIsActive(!isActive);
  const handleReset = () => {
    setIsActive(false);
    setStageIndex(0);
    setCountdown(stages[0].duration);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                <div className="flex flex-col justify-center">
                    <h3 className="text-3xl font-bold tracking-tight">Box Breathing</h3>
                    <p className="mt-4 text-muted-foreground">A simple technique to calm your nervous system. Follow the visual guide to regulate your breath and reduce stress.</p>
                    <div className="mt-8 space-y-4 text-lg">
                        {stages.map((stage, index) => (
                             <div key={index} className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">{index + 1}</div>
                                <p>{stage.name} for {stage.duration} seconds</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-4">
                        <Button onClick={handleStartPause} size="lg">
                            {isActive ? <Pause className="mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>}
                            {isActive ? 'Pause' : 'Begin Exercise'}
                        </Button>
                         <Button onClick={handleReset} variant="outline" size="lg">
                            <RotateCcw className="mr-2 h-5 w-5"/>
                            Reset
                        </Button>
                    </div>
                </div>
                <BoxBreathingVisualizer stageIndex={stageIndex} countdown={countdown} isActive={isActive} />
            </div>
        </CardContent>
    </Card>
  );
}


export default function ExercisesPage() {
  return (
    <>
    <style jsx global>{`
        @keyframes breathe {
            0%, 100% { transform: scale(0.8); }
            50% { transform: scale(1.2); }
        }
        .animate-breathe {
            animation: breathe 8s infinite ease-in-out;
        }
    `}</style>
    <div className="h-full flex flex-col bg-muted/30">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 bg-background">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">Mindful Exercises</h1>
              <p className="text-sm text-muted-foreground">
                Simple practices to find calm and focus.
              </p>
            </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-12">
        <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold tracking-tight">Stress Reduction Tools</h1>
                <p className="mt-2 text-lg text-muted-foreground">Find calm and focus with our guided exercises.</p>
            </div>
            <div className="border-b border-border/50">
                <nav className="-mb-px flex justify-center space-x-8">
                    <a className="whitespace-nowrap border-b-2 border-primary px-1 py-4 text-base font-semibold text-primary" href="#"> Box Breathing </a>
                    <a className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-base font-medium text-muted-foreground hover:border-border hover:text-foreground" href="#"> Guided Meditation </a>
                    <a className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-base font-medium text-muted-foreground hover:border-border hover:text-foreground" href="#"> Mindful Listening </a>
                </nav>
            </div>
            <div className="mt-10">
                <BoxBreathingExercise />
            </div>
        </div>
      </main>
    </div>
    </>
  );
}
