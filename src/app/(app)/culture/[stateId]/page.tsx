
'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { statesData } from '@/lib/states-data';
import { Button } from '@/components/ui/button';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';

export default function StateCulturePage() {
    const params = useParams();
    const stateId = params.stateId as string;
    const state = statesData.find(s => s.id === stateId);

    if (!state) {
        notFound();
    }

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/culture">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="sr-only">Back to Culture page</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">{state.name}</h1>
                        <p className="text-sm text-muted-foreground">Discover the Culture</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {state.entries.map((entry, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="text-2xl md:text-3xl">{entry.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {entry.youtubeUrl && (
                                    <div className="aspect-video overflow-hidden rounded-lg border shadow-lg">
                                        <iframe
                                            className="w-full h-full"
                                            src={entry.youtubeUrl}
                                            title={`Cultural video for ${entry.title}`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                                   {entry.description}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
