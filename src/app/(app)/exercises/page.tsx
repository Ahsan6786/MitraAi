
'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Brain, Eye, Ear, Hand, Coffee } from 'lucide-react';
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
    oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.2);
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
            return 0; 
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Box Breathing</CardTitle>
        <CardDescription>
          A technique to calm your nervous system and reduce stress.
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

const ExerciseCard = ({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                {icon} {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-3">
            {children}
        </CardContent>
    </Card>
);

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
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <BoxBreathingExercise />
            </div>

            <div className="space-y-6 lg:col-span-1">
                 <ExerciseCard
                    icon={<Brain className="w-6 h-6 text-primary"/>}
                    title="5-4-3-2-1 Grounding"
                    description="A simple method to anchor yourself in the present moment when you feel overwhelmed."
                >
                    <p>Acknowledge the following around you:</p>
                    <ul className="list-decimal list-inside pl-2 space-y-1">
                        <li><strong>5 things</strong> you can see.</li>
                        <li><strong>4 things</strong> you can touch.</li>
                        <li><strong>3 things</strong> you can hear.</li>
                        <li><strong>2 things</strong> you can smell.</li>
                        <li><strong>1 thing</strong> you can taste.</li>
                    </ul>
                </ExerciseCard>

                <ExerciseCard
                    icon={<Eye className="w-6 h-6 text-primary"/>}
                    title="Mindful Observation"
                    description="Practice focus by observing an object as if for the first time."
                >
                    <p>Pick a small, natural object, like a leaf or a stone.</p>
                    <p>Examine it closely for one minute. Notice its colors, textures, shape, and weight. Let any thoughts that arise drift away and gently bring your focus back to the object.</p>
                </ExerciseCard>
            </div>

            <div className="space-y-6 lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <ExerciseCard
                    icon={<Hand className="w-6 h-6 text-primary"/>}
                    title="Body Scan"
                    description="Connect with your body and release tension."
                >
                    <p>Sit or lie down comfortably. Close your eyes. Bring your attention to your toes. Notice any sensations without judgment. Slowly move your awareness up through your feet, legs, torso, arms, and finally to your head, spending a few moments on each part.</p>
                </ExerciseCard>
                 <ExerciseCard
                    icon={<Coffee className="w-6 h-6 text-primary"/>}
                    title="Three Deep Breaths"
                    description="A quick and powerful reset for any moment of the day."
                >
                    <p><strong>1.</strong> Take a long, slow breath in through your nose, filling your belly.</p>
                    <p><strong>2.</strong> Hold it for a moment.</p>
                    <p><strong>3.</strong> Exhale slowly through your mouth, letting go of any tension.</p>
                    <p>Repeat three times.</p>
                </ExerciseCard>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">When to Practice</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
                            <li>
                            <strong>In the Morning:</strong> Start your day with a clear and calm mind.
                            </li>
                            <li>
                            <strong>Before Bed:</strong> Help yourself relax and prepare for a restful sleep.
                            </li>
                            <li>
                            <strong>During Stressful Moments:</strong> Use these as tools to manage anxiety or pressure anytime during the day.
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
