'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lightbulb, Gamepad2, Hand, Scissors, Gem, RotateCcw, User, Bot, Brain, Puzzle, Smile, ArrowLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

// --- Game Components ---

function GuessTheNumberGame() {
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);
    const [secretNumber, setSecretNumber] = useState(0);

    useEffect(() => {
        resetGame();
    }, []);

    const resetGame = () => {
        setSecretNumber(Math.floor(Math.random() * 100) + 1);
        setGuess('');
        setMessage('');
        setAttempts(0);
        setIsCorrect(false);
    };

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

    return (
        <Card className="w-full max-w-md mx-auto">
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
                {(isCorrect || attempts > 7) && (
                    <Button onClick={resetGame} className="w-full">
                         <RotateCcw className="mr-2 h-4 w-4" />
                        Play Again
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

const games = [
    { id: 'memory-match', name: 'Memory Match', component: <p>Coming Soon</p>, description: "Test your memory with this classic game. Match pairs of cards to clear the board and improve focus.", image: "https://picsum.photos/600/400", imageHint: "abstract pattern" },
    { id: 'word-unscramble', name: 'Word Unscramble', component: <p>Coming Soon</p>, description: "Unscramble letters to form words. A fun way to boost your vocabulary and cognitive skills.", image: "https://picsum.photos/600/400", imageHint: "letters words" },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', component: <p>Coming Soon</p>, description: "A simple yet engaging game to challenge your strategic thinking. Play against the AI or a friend.", image: "https://picsum.photos/600/400", imageHint: "game strategy" },
    { id: 'guess-the-number', name: 'Guess the Number', component: <GuessTheNumberGame />, description: "I'm thinking of a number between 1 and 100. Can you guess it?", image: "https://picsum.photos/600/400", imageHint: "numbers abstract" },
];

// --- Main Page Component ---
export default function GamesPage() {
    const [activeGame, setActiveGame] = useState<string | null>(null);

    const SelectedGameComponent = games.find(g => g.id === activeGame)?.component;

    return (
        <div className="h-full flex flex-col bg-muted/20">
            <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Mind Games</h1>
                        <p className="text-sm text-muted-foreground">A fun way to refresh your mind.</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
               <div className="mx-auto max-w-5xl">
                {activeGame && SelectedGameComponent ? (
                     <div className="animate-in fade-in-50">
                        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Games
                        </Button>
                        {SelectedGameComponent}
                    </div>
                ) : (
                    <>
                        <div className="mb-10">
                            <h1 className="text-4xl font-bold tracking-tight">Calming Games</h1>
                            <p className="mt-2 text-lg text-muted-foreground">Engage your mind with relaxing games designed to promote mental wellness.</p>
                        </div>

                        {/* This is a visual-only tabs navigation for now */}
                        <div className="border-b">
                            <nav className="-mb-px flex space-x-8">
                                <span className="whitespace-nowrap border-b-2 border-primary px-1 py-4 text-base font-semibold text-primary"> All Games </span>
                            </nav>
                        </div>
                        
                        <div className="mt-10 space-y-16">
                           {games.map(game => (
                                <Card key={game.id} className="bg-card/80 backdrop-blur-sm">
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                                            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                                                <Image 
                                                    alt={`${game.name} Game`} 
                                                    className="h-full w-full object-cover" 
                                                    src={game.image}
                                                    width={600}
                                                    height={400}
                                                    data-ai-hint={game.imageHint}
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h3 className="text-2xl font-bold tracking-tight">{game.name}</h3>
                                                <p className="mt-2 text-muted-foreground">{game.description}</p>
                                                <div className="mt-6">
                                                    <Button onClick={() => setActiveGame(game.id)}>
                                                        Play Now
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                           ))}
                        </div>
                    </>
                )}

               </div>
            </main>
        </div>
    );
}
