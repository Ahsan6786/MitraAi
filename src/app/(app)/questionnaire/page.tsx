
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const questionnaireData = {
  title: "Depression Screening Questionnaire (Yes/No)",
  description: "This is a simple screening tool (not a diagnosis). Answer Yes or No to each question. Your score will help guide whether self-help or medical consultation is recommended.",
  questions: [
    { id: 1, text: "Are you basically satisfied with your life?", depressive_answer: "No" },
    { id: 2, text: "Have you dropped many of your activities and interests?", depressive_answer: "Yes" },
    { id: 3, text: "Do you feel that your life is empty?", depressive_answer: "Yes" },
    { id: 4, text: "Do you often get bored?", depressive_answer: "Yes" },
    { id: 5, text: "Are you in good spirits most of the time?", depressive_answer: "No" },
    { id: 6, text: "Are you afraid that something bad is going to happen to you?", depressive_answer: "Yes" },
    { id: 7, text: "Do you feel happy most of the time?", depressive_answer: "No" },
    { id: 8, text: "Do you often feel helpless?", depressive_answer: "Yes" },
    { id: 9, text: "Do you prefer to stay at home, rather than going out and doing new things?", depressive_answer: "Yes" },
    { id: 10, text: "Do you feel you have more problems with memory than most?", depressive_answer: "Yes" },
    { id: 11, text: "Do you think it is wonderful to be alive now?", depressive_answer: "No" },
    { id: 12, text: "Do you feel pretty worthless the way you are now?", depressive_answer: "Yes" },
    { id: 13, text: "Do you feel full of energy?", depressive_answer: "No" },
    { id: 14, text: "Do you feel that your situation is hopeless?", depressive_answer: "Yes" },
    { id: 15, text: "Do you think that most people are better off than you are?", depressive_answer: "Yes" }
  ],
  scoring: {
    "0-4": { level: "Normal", recommendation: "No immediate concern. Maintain a healthy lifestyle." },
    "5-8": { level: "Mild Depression", recommendation: "Try self-help: daily exercise, meditation, journaling, hobbies, and social interaction." },
    "9-11": { level: "Moderate Depression", recommendation: "Consult a doctor or therapist. Self-help can support but professional advice is needed." },
    "12-15": { level: "Severe Depression", recommendation: "Seek professional help immediately (psychiatrist/psychologist)." }
  },
};

type Answers = { [key: number]: string };

export default function QuestionnairePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [answers, setAnswers] = useState<Answers>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ level: string; recommendation: string; } | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const totalQuestions = questionnaireData.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const currentQuestion = questionnaireData.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (answers[currentQuestion.id]) {
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
        let score = 0;
        questionnaireData.questions.forEach(q => {
            if (answers[q.id] === q.depressive_answer) {
                score++;
            }
        });
        return score;
    };

    const getResultFromScore = (score: number) => {
        if (score <= 4) return questionnaireData.scoring["0-4"];
        if (score <= 8) return questionnaireData.scoring["5-8"];
        if (score <= 11) return questionnaireData.scoring["9-11"];
        return questionnaireData.scoring["12-15"];
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

    if (!user) {
        router.push('/signin');
        return null;
    }
    
    if (result) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <CardTitle className="mt-4">Thank You for Completing the Questionnaire</CardTitle>
                        <CardDescription>Here is your initial assessment. A detailed report will be available in the Doctor's Reports section after review.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="rounded-md border bg-background p-4 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Your Result Level</p>
                            <p className="text-2xl font-bold text-primary">{result.level}</p>
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
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push('/chat')}>
                            Continue to App
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>{questionnaireData.title}</CardTitle>
                    <CardDescription>{questionnaireData.description}</CardDescription>
                    <div className="pt-4">
                         <Progress value={progress} className="w-full" />
                         <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex justify-center" style={{ minHeight: '180px' }}>
                    <div key={currentQuestion.id} className="rounded-lg border bg-background p-4 shadow-sm flex flex-col items-center transition-all duration-300 animate-in fade-in">
                        <p className="font-medium text-foreground text-center text-lg">{currentQuestion.text}</p>
                        <RadioGroup
                            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                            className="mt-6 flex items-center gap-6"
                            value={answers[currentQuestion.id] || ''}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Yes" id={`q${currentQuestion.id}-yes`} />
                                <Label htmlFor={`q${currentQuestion.id}-yes`} className="cursor-pointer text-base">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="No" id={`q${currentQuestion.id}-no`} />
                                <Label htmlFor={`q${currentQuestion.id}-no`} className="cursor-pointer text-base">No</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    {isLastQuestion ? (
                         <Button onClick={handleSubmit} disabled={isSubmitting || !answers[currentQuestion.id]} className="w-48">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Submit & See My Result
                        </Button>
                    ) : (
                        <Button onClick={handleNext} disabled={!answers[currentQuestion.id]} className="w-48">
                            Next
                             <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
