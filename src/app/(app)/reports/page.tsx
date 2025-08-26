
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { FileClock } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Doctor's Reports</h1>
                      <p className="text-sm text-muted-foreground">
                          View feedback from your doctor on your journal entries.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex items-center justify-center">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                            <FileClock className="w-12 h-12 text-primary" />
                        </div>
                        <CardTitle>Feature Coming Soon!</CardTitle>
                        <CardDescription>
                            We are working hard to bring you professional doctor's reports. This feature will be available shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Thank you for your patience!
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
