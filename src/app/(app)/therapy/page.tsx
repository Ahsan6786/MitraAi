
'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowLeft, Wind, Waves, Laugh, Frown } from 'lucide-react';

type Mood = 'stress' | 'anxiety' | 'sadness' | 'happiness';

interface TherapyVideo {
  id: string;
  title: string;
  description: string;
  mood: Mood;
  icon: React.ElementType;
}

const therapyVideos: TherapyVideo[] = [
  {
    id: '22pSycMdCl0',
    title: 'Forest Therapy for Stress',
    description: 'Immerse yourself in a calming forest environment to melt away stress and tension.',
    mood: 'stress',
    icon: Wind,
  },
  {
    id: 's-3b_54098A',
    title: 'Relaxing Ocean for Anxiety',
    description: 'Let the gentle rhythm of ocean waves soothe your mind and ease anxiety.',
    mood: 'anxiety',
    icon: Waves,
  },
  {
    id: 'qt_f7CHg-uE',
    title: 'Peaceful Nature for Sadness',
    description: 'Find solace and comfort in the serene beauty of nature when you are feeling down.',
    mood: 'sadness',
    icon: Frown,
  },
  {
    id: 'Fz-071g-J_U',
    title: 'Playful Puppies for Happiness',
    description: 'Boost your mood and feel a surge of joy with this delightful 360° video of puppies.',
    mood: 'happiness',
    icon: Laugh,
  },
];

export default function TherapyPage() {
  const [selectedVideo, setSelectedVideo] = useState<TherapyVideo | null>(null);

  if (selectedVideo) {
    return (
      <div className="h-full flex flex-col">
        <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedVideo(null)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-lg md:text-xl font-bold">{selectedVideo.title}</h1>
                    <p className="text-sm text-muted-foreground">Immerse yourself in the experience</p>
                </div>
            </div>
             <div className="flex items-center gap-2">
                <GenZToggle />
                <ThemeToggle />
            </div>
        </header>
        <main className="flex-1 bg-black flex items-center justify-center">
            <div className="w-full h-full aspect-video">
                 <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">360° VR Therapy</h1>
            <p className="text-sm text-muted-foreground">
              Choose an experience based on your mood.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">How are you feeling?</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select an option below to begin your immersive therapy session.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {therapyVideos.map((video) => {
                    const Icon = video.icon;
                    return (
                         <Card key={video.mood} className="flex flex-col hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{video.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{video.description}</p>
                            </CardContent>
                            <CardContent>
                                <Button className="w-full" onClick={() => setSelectedVideo(video)}>
                                    Start Session
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
      </main>
    </div>
  );
}
