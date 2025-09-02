
'use client';

import { useParams, notFound } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { statesData } from '@/lib/states-data';

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
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">{state.name}</h1>
                        <p className="text-sm text-muted-foreground">Discover the Culture</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl md:text-3xl">A Glimpse into {state.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video overflow-hidden rounded-lg border shadow-lg">
                                <iframe
                                    className="w-full h-full"
                                    src={state.youtubeUrl}
                                    title={`Cultural video of ${state.name}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cultural Knowledge</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                           {state.description}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
