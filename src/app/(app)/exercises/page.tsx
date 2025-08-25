
'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const stages = [
  { name: 'Breathe In', duration: 4 },
  { name: 'Hold', duration: 4 },
  { name: 'Breathe Out', duration: 4 },
  { name: 'Hold', duration: 4 },
];

function BoxBreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(stages[0].duration);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    if (!audioContextRef.current) {
        // Create AudioContext on user interaction
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); // A4 pitch
    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.2); // Beep for 0.2 seconds
  };

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev > 1) {
            return prev - 1;
          } else {
            playBeep();
            setStageIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % stages.length;
              setCountdown(stages[nextIndex].duration);
              return nextIndex;
            });
            return 0; // This will be updated immediately by the setCountdown above
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const handleStartPause = () => {
    if (audioContextRef.current === null) {
      // Initialize AudioContext on the first user interaction
       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setStageIndex(0);
    setCountdown(stages[0].duration);
  };
  
  const currentStage = stages[stageIndex];
  const totalDuration = stages.reduce((acc, stage) => acc + stage.duration, 0);
  const currentProgress = (
    (stageIndex * stages[0].duration + (stages[0].duration - countdown)) / totalDuration
  ) * 100;


  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Box Breathing</CardTitle>
        <CardDescription>
          A simple technique to calm your nervous system and reduce stress.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-8 py-8">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
          <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
          <div 
            className="absolute inset-0 rounded-full bg-primary/20 transition-transform duration-1000 ease-linear"
            style={{ transform: `scale(${isActive ? 1 : 0.8})` }}
          />
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             <p className="text-2xl sm:text-3xl font-bold text-primary transition-opacity duration-500">{currentStage.name}</p>
             <p className="text-5xl sm:text-6xl font-semibold mt-2">{countdown}</p>
           </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleStartPause} size="lg" className="w-28">
            {isActive ? <Pause className="mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg">
             <RotateCcw className="mr-2 h-5 w-5"/>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExercisesPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
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
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex flex-col items-center justify-start space-y-6">
        <BoxBreathingExercise />
        <Card className="w-full max-w-md mx-auto">
           <CardHeader>
              <CardTitle className="text-lg">When to Practice</CardTitle>
           </CardHeader>
           <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>
                  <strong>In the Morning:</strong> Start your day with a clear and calm mind.
                </li>
                 <li>
                  <strong>Before Bed:</strong> Help yourself relax and prepare for a restful sleep.
                </li>
                 <li>
                  <strong>During Stressful Moments:</strong> Use it as a tool to manage anxiety or pressure anytime during the day.
                </li>
              </ul>
           </CardContent>
        </Card>
      </main>
    </div>
  );
}
