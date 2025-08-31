
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, FileText, CheckCircle2, FileQuestion, PenSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface JournalReport {
    id: string;
    type: 'journal';
    createdAt: Timestamp;
    mood: string;
    content: string;
    doctorReport: string;
}

interface QuestionnaireReport {
    id: string;
    type: 'questionnaire';
    createdAt: Timestamp;
    score: number;
    result: { level: string; recommendation: string; };
    doctorFeedback: string;
}

type Report = JournalReport | QuestionnaireReport;

export default function ReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchReports = () => {
            setIsLoading(true);
            const journalsQuery = query(
                collection(db, 'journalEntries'),
                where('userId', '==', user.uid),
                where('reviewed', '==', true)
            );
            const questionnairesQuery = query(
                collection(db, 'questionnaires'),
                where('userId', '==', user.uid),
                where('reviewed', '==', true)
            );

            const unsubJournals = onSnapshot(journalsQuery, (snapshot) => {
                const journalReports = snapshot.docs.map(doc => ({ id: doc.id, type: 'journal', ...doc.data() } as JournalReport));
                setReports(prev => {
                    const otherReports = prev.filter(r => r.type !== 'journal');
                    const allReports = [...journalReports, ...otherReports];
                    allReports.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                    return allReports;
                });
                setIsLoading(false);
            });

            const unsubQuestionnaires = onSnapshot(questionnairesQuery, (snapshot) => {
                const questionnaireReports = snapshot.docs.map(doc => ({ id: doc.id, type: 'questionnaire', ...doc.data() } as QuestionnaireReport));
                setReports(prev => {
                    const otherReports = prev.filter(r => r.type !== 'questionnaire');
                    const allReports = [...questionnaireReports, ...otherReports];
                    allReports.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                    return allReports;
                });
                 setIsLoading(false);
            });

            return () => {
                unsubJournals();
                unsubQuestionnaires();
            };
        };

        const unsubscribe = fetchReports();
        return () => unsubscribe && unsubscribe();

    }, [user]);

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Doctor's Reports</h1>
                      <p className="text-sm text-muted-foreground">
                          View feedback from your doctor on your submissions.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : reports.length === 0 ? (
                        <Card className="w-full text-center">
                            <CardHeader>
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                    <FileText className="w-12 h-12 text-primary" />
                                </div>
                                <CardTitle>No Reports Yet</CardTitle>
                                <CardDescription>
                                    Once a doctor reviews your journal entries or questionnaires, the reports will appear here.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {reports.map(report => (
                                <AccordionItem value={report.id} key={report.id} className="border rounded-lg bg-card">
                                    <AccordionTrigger className="p-4 hover:no-underline text-left">
                                        <div className="flex items-center gap-4 w-full">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            {report.type === 'journal' ? <PenSquare className="w-5 h-5 text-primary" /> : <FileQuestion className="w-5 h-5 text-primary" />}
                                            <div className="flex-1">
                                                <p className="font-semibold capitalize">{report.type} Report</p>
                                                <p className="text-sm text-muted-foreground">{report.createdAt.toDate().toLocaleString()}</p>
                                            </div>
                                             {report.type === 'journal' && <Badge variant="secondary">{report.mood}</Badge>}
                                             {report.type === 'questionnaire' && <Badge variant="destructive">{report.result.level}</Badge>}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t space-y-4">
                                        {report.type === 'journal' && (
                                            <>
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">Your Entry:</h4>
                                                    <p className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md">"{report.content}"</p>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">Doctor's Report:</h4>
                                                    <p className="text-sm p-3 bg-primary/10 rounded-md whitespace-pre-wrap">{report.doctorReport}</p>
                                                </div>
                                            </>
                                        )}
                                        {report.type === 'questionnaire' && (
                                             <>
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">Initial Assessment:</h4>
                                                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md"><strong>{report.result.level}:</strong> {report.result.recommendation}</p>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">Doctor's Feedback:</h4>
                                                    <p className="text-sm p-3 bg-primary/10 rounded-md whitespace-pre-wrap">{report.doctorFeedback}</p>
                                                </div>
                                            </>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </main>
        </div>
    );
}
