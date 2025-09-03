
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2, FileText, Download, PenSquare, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Logo } from '@/components/icons';

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
    testName: string;
    score: number;
    result: { level: string; recommendation: string; };
    doctorFeedback: string;
}

type Report = JournalReport | QuestionnaireReport;

const ReportCard = ({ report }: { report: Report }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        const reportElement = document.getElementById(`report-${report.id}`);
        if (!reportElement) {
            setIsDownloading(false);
            return;
        }

        const canvas = await html2canvas(reportElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4'); // Standard A4 page
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let finalPdfWidth = pdfWidth;
        let finalPdfHeight = pdfWidth / canvasAspectRatio;

        // If the calculated height is greater than the page height, scale down
        if (finalPdfHeight > pdfHeight) {
            finalPdfHeight = pdfHeight;
            finalPdfWidth = pdfHeight * canvasAspectRatio;
        }

        const x = (pdfWidth - finalPdfWidth) / 2;
        const y = (pdfHeight - finalPdfHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalPdfWidth, finalPdfHeight);
        pdf.save(`MitraAI_Report_${report.createdAt.toDate().toLocaleDateString()}.pdf`);
        setIsDownloading(false);
    };
    
    const title = report.type === 'journal' 
        ? `Journal Report - ${report.createdAt.toDate().toLocaleDateString()}` 
        : `${report.testName} Report - ${report.createdAt.toDate().toLocaleDateString()}`;

    return (
        <Card className="bg-[#1A1E24] text-white border-gray-700">
             {/* This off-screen div is used for PDF generation */}
            <div 
              id={`report-${report.id}`} 
              style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '800px', background: '#1A1E24', color: 'white' }}
            >
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                       <Logo className="w-10 h-10 text-primary"/>
                       <h1 className="text-2xl font-bold">MitraAI Wellness Report</h1>
                    </div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-sm text-gray-400">Generated on: {new Date().toLocaleDateString()}</p>
                    <div className="mt-6 space-y-6">
                        {report.type === 'journal' ? (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold">Your Entry (Mood: {report.mood})</h3>
                                    <p className="mt-2 text-gray-300 italic">"{report.content}"</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Doctor's Feedback</h3>
                                    <p className="mt-2 text-gray-300 whitespace-pre-wrap">{report.doctorReport}</p>
                                </div>
                            </>
                        ) : (
                             <>
                                <div>
                                    <h3 className="text-lg font-semibold">Initial Assessment (Score: {report.score})</h3>
                                    {report.result && <p className="mt-2 text-gray-300"><strong>{report.result.level}:</strong> {report.result.recommendation}</p>}
                                </div>
                                 <div>
                                    <h3 className="text-lg font-semibold">Doctor's Feedback</h3>
                                    <p className="mt-2 text-gray-300 whitespace-pre-wrap">{report.doctorFeedback}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* This is the visible card content */}
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="tracking-tight text-xl md:text-2xl">{title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-1">Generated on: {report.createdAt.toDate().toLocaleDateString()}</CardDescription>
                    </div>
                    <Button onClick={handleDownloadPdf} disabled={isDownloading} className="w-full md:w-auto">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                        Download PDF
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 {report.type === 'journal' && (
                    <>
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2"><PenSquare className="w-5 h-5"/>Your Entry</h3>
                             <p className="mt-2 text-gray-400 italic p-4 bg-black/20 rounded-md">"{report.content}"</p>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold">Doctor's Feedback</h3>
                            <p className="mt-2 text-gray-300 list-disc space-y-2 pl-6 whitespace-pre-wrap">{report.doctorReport}</p>
                        </div>
                    </>
                )}
                {report.type === 'questionnaire' && (
                     <>
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2"><FileQuestion className="w-5 h-5"/>Initial Assessment</h3>
                             {report.result && <p className="mt-2 text-gray-400 p-4 bg-black/20 rounded-md"><strong>{report.result.level}:</strong> {report.result.recommendation}</p>}
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold">Doctor's Feedback</h3>
                            <p className="mt-2 text-gray-300 list-disc space-y-2 pl-6 whitespace-pre-wrap">{report.doctorFeedback}</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default function ReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

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
                return [...journalReports, ...otherReports].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            });
            setIsLoading(false);
        });

        const unsubQuestionnaires = onSnapshot(questionnairesQuery, (snapshot) => {
            const questionnaireReports = snapshot.docs.map(doc => ({ id: doc.id, type: 'questionnaire', ...doc.data() } as QuestionnaireReport));
            setReports(prev => {
                const otherReports = prev.filter(r => r.type !== 'questionnaire');
                return [...questionnaireReports, ...otherReports].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            });
            setIsLoading(false);
        });

        return () => {
            unsubJournals();
            unsubQuestionnaires();
        };

    }, [user]);

    return (
        <div className="h-full flex flex-col bg-muted/20">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 bg-background">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">Doctor's Reports</h1>
                      <p className="text-sm text-muted-foreground">
                          View professional feedback on your submissions.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-4xl mx-auto">
                     <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Professional Insights</h1>
                        <p className="mt-2 text-lg text-muted-foreground">View confidential reports and insights from our team of professionals.</p>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : reports.length === 0 ? (
                        <Card className="w-full text-center bg-card">
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
                        <div className="space-y-8">
                            {reports.map(report => (
                                <ReportCard key={report.id} report={report} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
