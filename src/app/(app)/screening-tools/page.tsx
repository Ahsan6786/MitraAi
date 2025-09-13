
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { screeningToolsData } from '@/lib/screening-tools';
import Link from 'next/link';
import { ArrowRight, FileQuestion } from 'lucide-react';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';

export default function ScreeningToolsPage() {
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Screening Tools</h1>
                        <p className="text-sm text-muted-foreground">
                            Choose a questionnaire to understand your well-being.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12 flex items-center justify-center">
                <div className="w-full max-w-4xl space-y-10">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Select a Screening Tool</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            These clinically recognized questionnaires are designed to help you gain insight into your mental health.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Object.values(screeningToolsData).map((tool) => (
                            <Card key={tool.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <FileQuestion className="w-6 h-6 text-primary" />
                                        {tool.name}
                                    </CardTitle>
                                    <CardDescription>{tool.full_name}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">
                                        A {tool.questions_count}-item questionnaire for {tool.purpose}.
                                    </p>
                                </CardContent>
                                <CardContent>
                                    <Button asChild className="w-full">
                                        <Link href={`/questionnaire?test=${tool.id}`}>
                                            Start {tool.name} Test <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
