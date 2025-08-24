'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Gamepad2, Lightbulb } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function GamesPage() {
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Generate the secret number only once on the client-side
    const secretNumber = useMemo(() => Math.floor(Math.random() * 100) + 1, []);

    // Effect to handle client-side rendering
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (isCorrect) return;

        const numGuess = parseInt(guess, 10);
        if (isNaN(numGuess) || numGuess < 1 || numGuess > 100) {
            setMessage('Please enter a valid number between 1 and 100.');
            return;
        }

        setAttempts(prev => prev + 1);

        if (numGuess === secretNumber) {
            setMessage(`Congratulations! You guessed the number ${secretNumber} in ${attempts + 1} attempts.`);
            setIsCorrect(true);
        } else if (numGuess < secretNumber) {
            setMessage('Too low! Try a higher number.');
        } else {
            setMessage('Too high! Try a lower number.');
        }
        setGuess('');
    };

    const handleReset = () => {
        // This will cause a re-render, and useMemo will generate a new number.
        // A more robust way would be to lift state, but this works for a simple game.
        // Forcing a re-render to get a new memoized value can be done by changing a key on the component,
        // but for now we will just reload the page.
        window.location.reload();
    };

    if (!isClient) {
        return null; // Render nothing on the server to avoid hydration mismatch
    }

    return (
        <div className="h-full flex flex-col bg-muted/20">
            <header className="border-b bg-background p-3 md:p-4 flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <div>
                    <h1 className="text-lg md:text-xl font-bold">Mind Games</h1>
                    <p className="text-sm text-muted-foreground">A fun way to refresh your mind.</p>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gamepad2 className="w-6 h-6 text-primary" />
                            Guess the Number!
                        </CardTitle>
                        <CardDescription>
                            I'm thinking of a number between 1 and 100. Can you guess it?
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleGuess}>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Enter your guess"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    disabled={isCorrect}
                                    className="text-base"
                                />
                                <Button type="submit" disabled={isCorrect}>
                                    Guess
                                </Button>
                            </div>
                            {message && (
                                <Alert variant={isCorrect ? 'default' : 'destructive'} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                                    {isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Lightbulb className="h-4 w-4" />}
                                    <AlertTitle>{isCorrect ? 'You got it!' : 'Hint'}</AlertTitle>
                                    <AlertDescription>
                                        {message}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </form>
                    <CardFooter className="flex-col gap-4 items-start">
                        <p className="text-sm text-muted-foreground">Attempts: {attempts}</p>
                        {isCorrect && (
                            <Button onClick={handleReset} className="w-full">
                                Play Again
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
