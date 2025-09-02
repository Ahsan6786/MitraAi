
'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const stages = [
  { name: 'Breathe In', duration: 4, animation: 'animate-breathe-in' },
  { name: 'Hold', duration: 4, animation: 'animate-hold' },
  { name: 'Breathe Out', duration: 4, animation: 'animate-breathe-out' },
  { name: 'Hold', duration: 4, animation: 'animate-hold' },
];

function BoxBreathingVisualizer({ stageIndex, countdown, isActive }: { stageIndex: number, countdown: number, isActive: boolean }) {
  const currentStage = stages[stageIndex];

  return (
    <div className="flex h-96 items-center justify-center rounded-lg bg-background/50">
        <div className="relative flex h-64 w-64 items-center justify-center">
            {/* Dashed circle */}
            <div className="absolute h-full w-full rounded-full border-2 border-dashed border-muted-foreground/50"></div>
            
            {/* Animated dot */}
            <div 
              key={stageIndex} // Re-trigger animation on stage change
              className={cn(
                "h-16 w-16 rounded-full bg-primary",
                isActive && currentStage.animation
              )}
            ></div>
            
            {/* Labels */}
            <div className="absolute top-0 flex flex-col items-center">
                <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Breathe In' ? 'text-foreground' : 'text-muted-foreground')}>Breathe In</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Breathe In' ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Breathe In' ? countdown : '4'}s</span>
            </div>
            <div className="absolute right-0 flex flex-col items-center -rotate-90">
                <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Hold' && stageIndex === 1 ? 'text-foreground' : 'text-muted-foreground')}>Hold</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Hold' && stageIndex === 1 ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Hold' && stageIndex === 1 ? countdown : '4'}s</span>
            </div>
            <div className="absolute bottom-0 flex flex-col items-center">
                 <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Breathe Out' ? 'text-foreground' : 'text-muted-foreground')}>Breathe Out</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Breathe Out' ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Breathe Out' ? countdown : '4'}s</span>
            </div>
             <div className="absolute left-0 flex flex-col items-center rotate-90">
                <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Hold' && stageIndex === 3 ? 'text-foreground' : 'text-muted-foreground')}>Hold</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Hold' && stageIndex === 3 ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Hold' && stageIndex === 3 ? countdown : '4'}s</span>
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
            // This return is for setCountdown, which will be updated in the next render cycle.
            // The value here doesn't matter as much as the state updates above.
            return stages[(stageIndex + 1) % stages.length].duration; 
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, stageIndex]);

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
        @keyframes breathe-in {
            0% { transform: scale(0.8); }
            100% { transform: scale(1.2); }
        }
        @keyframes hold {
            0%, 100% { transform: scale(1.2); }
        }
        @keyframes breathe-out {
            0% { transform: scale(1.2); }
            100% { transform: scale(0.8); }
        }
        .animate-breathe-in {
            animation: breathe-in 4s ease-in-out forwards;
        }
        .animate-hold {
             animation: hold 4s ease-in-out forwards;
        }
        .animate-breathe-out {
            animation: breathe-out 4s ease-in-out forwards;
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
             <Tabs defaultValue="box-breathing" className="w-full">
                <TabsList className="flex justify-center -mb-px bg-transparent p-0 gap-8">
                    <TabsTrigger value="box-breathing" className="whitespace-nowrap border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-4 text-base font-semibold data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground rounded-none shadow-none bg-transparent">
                         Box Breathing 
                    </TabsTrigger>
                    <TabsTrigger value="meditation" className="whitespace-nowrap border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-4 text-base font-medium data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground rounded-none shadow-none bg-transparent">
                        Guided Meditation
                    </TabsTrigger>
                     <TabsTrigger value="listening" className="whitespace-nowrap border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-4 text-base font-medium data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground rounded-none shadow-none bg-transparent">
                       Mindful Listening
                    </TabsTrigger>
                </TabsList>
                <div className="border-b border-border/50"></div>
                <div className="mt-10">
                    <TabsContent value="box-breathing">
                        <BoxBreathingExercise />
                    </TabsContent>
                    <TabsContent value="meditation">
                        <Card className="text-center p-10">
                            <h3 className="text-2xl font-bold">Guided Meditation</h3>
                            <p className="text-muted-foreground mt-2">Coming soon! A guided meditation to help you relax and focus.</p>
                        </Card>
                    </TabsContent>
                    <TabsContent value="listening">
                        <Card className="text-center p-10">
                            <h3 className="text-2xl font-bold">Mindful Listening</h3>
                            <p className="text-muted-foreground mt-2">Coming soon! An exercise to help you focus on the present moment through sound.</p>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
      </main>
    </div>
    </>
  );
}
