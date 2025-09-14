
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { screeningToolsData, ScreeningToolId } from '@/lib/screening-tools';

type Answers = { [key: number]: number };

const motivationalMessages = [
    "You're doing great!",
    "Keep it up, you're making progress!",
    "Every step forward is a victory.",
    "Almost there, you've got this!",
    "Thank you for sharing, this is helpful.",
    "Just a few more to go!",
    "Well done for taking this step."
];

function QuestionnaireContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [testId, setTestId] = useState<ScreeningToolId | null>(null);
    const [questionnaireData, setQuestionnaireData] = useState<typeof screeningToolsData[ScreeningToolId] | null>(null);
    const [answers, setAnswers] = useState<Answers>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ severity: string; recommendation: string; } | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [motivationalMessage, setMotivationalMessage] = useState('');

    const randomMessage = useMemo(() => {
        return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    }, [currentQuestionIndex]);
    
    useEffect(() => {
        if (currentQuestionIndex > 0 && currentQuestionIndex % 2 === 0) {
            setMotivationalMessage(randomMessage);
            const timer = setTimeout(() => setMotivationalMessage(''), 2000); // Hide after 2 seconds
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, randomMessage]);

    useEffect(() => {
        const id = searchParams.get('test') as ScreeningToolId;
        if (id && id in screeningToolsData) {
            setTestId(id);
            setQuestionnaireData(screeningToolsData[id]);
        } else {
            // Redirect if the test is invalid or not found
            router.replace('/screening-tools');
        }
    }, [searchParams, router]);

    // This useEffect must be called before any conditional returns
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ensure data is loaded before processing keydown
            if (!questionnaireData) return;

            const currentQuestion = questionnaireData.questions[currentQuestionIndex];
            const isLastQuestion = currentQuestionIndex === questionnaireData.questions.length - 1;

            if (event.key === 'Enter' && answers[currentQuestion.id] !== undefined) {
                if (isLastQuestion) {
                    document.getElementById('submit-button')?.click();
                } else {
                    document.getElementById('next-button')?.click();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [answers, currentQuestionIndex, questionnaireData]);


    if (!questionnaireData || !testId) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const { questions, interpretation } = questionnaireData;
    const scoring_options = 'scoring_options' in questionnaireData ? questionnaireData.scoring_options : questionnaireData.scoring_methods.find(m => m.method === 'Likert')?.options || [];
    const totalQuestions = questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    const handleAnswerChange = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (answers[currentQuestion.id] !== undefined) {
            if (!isLastQuestion) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateScore = () => {
        return Object.values(answers).reduce((sum, value) => sum + value, 0);
    };

    const getResultFromScore = (score: number) => {
        if (typeof interpretation === 'string') {
            return { severity: "Result based on score", recommendation: `${interpretation} Your score is ${score}.` };
        }
        
        const resultTier = interpretation.find(tier => {
            if (tier.range.includes('-')) {
                const [min, max] = tier.range.split('-').map(Number);
                return score >= min && score <= max;
            }
            return false;
        });
        return resultTier ? { severity: resultTier.severity, recommendation: resultTier.recommendation || "Follow up with a professional for guidance." } : { severity: "Result could not be determined", recommendation: "Please consult a professional."};
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length !== totalQuestions) {
            toast({ title: "Please answer all questions.", variant: "destructive" });
            return;
        }
        if (!user) return;

        setIsSubmitting(true);
        const score = calculateScore();
        const resultData = getResultFromScore(score);
        setResult(resultData);

        try {
            await addDoc(collection(db, 'questionnaires'), {
                userId: user.uid,
                userEmail: user.email,
                testId: testId,
                testName: questionnaireData.name,
                answers,
                score,
                result: resultData,
                createdAt: serverTimestamp(),
                reviewed: false,
                doctorFeedback: null,
            });
            toast({ title: "Questionnaire Submitted", description: "Your results have been saved and sent for review." });
        } catch (error) {
            console.error("Error submitting questionnaire: ", error);
            toast({ title: "Submission Failed", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (result) {
        return (
             <div className="flex h-screen items-center justify-center p-4 bg-background">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <CardTitle className="mt-4">Thank You for Completing the {questionnaireData.name}</CardTitle>
                        <CardDescription>Here is your initial assessment. A detailed report will be available in the Doctor's Reports section after review.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="rounded-md border bg-background p-4 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Your Result Level</p>
                            <p className="text-2xl font-bold text-primary">{result.severity}</p>
                         </div>
                         <div className="rounded-md border bg-background p-4">
                            <p className="text-sm font-medium text-muted-foreground">Recommendation</p>
                            <p className="mt-1">{result.recommendation}</p>
                         </div>
                         <div className="flex items-start gap-3 rounded-md border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600"/>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <strong>Disclaimer:</strong> This tool is for screening purposes only and is not a substitute for a professional diagnosis.
                            </p>
                         </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        <Button className="w-full" onClick={() => router.push('/screening-tools')}>
                            Take Another Test
                        </Button>
                        <Button className="w-full" variant="outline" onClick={() => router.push('/chat')}>
                            Continue to App
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col bg-background">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">{questionnaireData.full_name}</h1>
                    </div>
                </div>
                 <Progress value={progress} className="w-1/3 mx-auto hidden md:block" />
                 <div className="text-sm text-muted-foreground hidden md:block">{currentQuestionIndex + 1} / {totalQuestions}</div>
            </header>
            <main className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-auto">
                <div className="w-full max-w-2xl space-y-4">
                    {motivationalMessage && (
                        <div className="flex items-center justify-center gap-2 text-primary font-medium animate-in fade-in-50">
                            <Sparkles className="w-5 h-5" />
                            {motivationalMessage}
                        </div>
                    )}
                    <Card className="w-full">
                         <CardHeader className="md:hidden">
                            <Progress value={progress} />
                            <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                         </CardHeader>
                         <CardContent className="flex flex-col items-center justify-center p-6 md:p-10 min-h-[250px] text-center">
                            <p className="font-medium text-foreground text-xl md:text-2xl">{currentQuestion.text}</p>
                             <RadioGroup
                                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                                className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                                value={answers[currentQuestion.id]?.toString() || ''}
                            >
                                {scoring_options.map(option => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.value.toString()} id={`q${currentQuestion.id}-opt${option.value}`} />
                                        <Label htmlFor={`q${currentQuestion.id}-opt${option.value}`} className="cursor-pointer text-base">
                                            {option.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                         </CardContent>
                         <CardFooter className="flex justify-between border-t pt-4">
                            <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Previous
                            </Button>
                            {isLastQuestion ? (
                                <Button id="submit-button" onClick={handleSubmit} disabled={isSubmitting || answers[currentQuestion.id] === undefined} size="lg">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Submit
                                </Button>
                            ) : (
                                <Button id="next-button" onClick={handleNext} disabled={answers[currentQuestion.id] === undefined} size="lg">
                                    Next
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}

export default function QuestionnairePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <QuestionnaireContent />
        </Suspense>
    );
}
