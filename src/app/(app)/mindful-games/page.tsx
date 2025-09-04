
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, CheckCircle, Lightbulb, Gamepad2, ArrowLeft, Cat, Dog, Bird, Fish, Rabbit, Turtle, Bug, Snail, X, Circle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Mindful Exercises Components ---

const stages = [
  { name: 'Breathe In', duration: 4, animation: 'animate-breathe-in' },
  { name: 'Hold', duration: 4, animation: 'animate-hold' },
  { name: 'Breathe Out', duration: 4, animation: 'animate-breathe-out' },
  { name: 'Hold', duration: 4, animation: 'animate-hold' },
];

function BoxBreathingVisualizer({ stageIndex, countdown, isActive }: { stageIndex: number, countdown: number, isActive: boolean }) {
  const currentStage = stages[stageIndex];

  return (
    <div className="flex h-96 items-center justify-center rounded-lg bg-background/50">
        <div className="relative flex h-64 w-64 items-center justify-center">
            {/* Dashed circle */}
            <div className="absolute h-full w-full rounded-full border-2 border-dashed border-muted-foreground/50"></div>
            
            {/* Animated dot */}
            <div 
              key={stageIndex} // Re-trigger animation on stage change
              className={cn(
                "h-16 w-16 rounded-full bg-primary",
                isActive && currentStage.animation
              )}
            ></div>
            
            {/* Labels */}
            <div className="absolute top-0 flex flex-col items-center">
                <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Breathe In' ? 'text-foreground' : 'text-muted-foreground')}>Breathe In</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Breathe In' ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Breathe In' ? countdown : '4'}s</span>
            </div>
            <div className="absolute right-0 flex flex-col items-center -rotate-90">
                <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Hold' && stageIndex === 1 ? 'text-foreground' : 'text-muted-foreground')}>Hold</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Hold' && stageIndex === 1 ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Hold' && stageIndex === 1 ? countdown : '4'}s</span>
            </div>
            <div className="absolute bottom-0 flex flex-col items-center">
                 <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Breathe Out' ? 'text-foreground' : 'text-muted-foreground')}>Breathe Out</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Breathe Out' ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Breathe Out' ? countdown : '4'}s</span>
            </div>
             <div className="absolute left-0 flex flex-col items-center rotate-90">
                <span className={cn("text-sm font-medium transition-colors", currentStage.name === 'Hold' && stageIndex === 3 ? 'text-foreground' : 'text-muted-foreground')}>Hold</span>
                <span className={cn("text-2xl font-bold transition-colors", currentStage.name === 'Hold' && stageIndex === 3 ? 'text-foreground' : 'text-muted-foreground')}>{currentStage.name === 'Hold' && stageIndex === 3 ? countdown : '4'}s</span>
            </div>
        </div>
    </div>
  );
}


function BoxBreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(stages[0].duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev > 1) {
            return prev - 1;
          } else {
            setStageIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % stages.length;
              setCountdown(stages[nextIndex].duration);
              return nextIndex;
            });
            // This return is for setCountdown, which will be updated in the next render cycle.
            // The value here doesn't matter as much as the state updates above.
            return stages[(stageIndex + 1) % stages.length].duration; 
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, stageIndex]);

  const handleStartPause = () => setIsActive(!isActive);
  const handleReset = () => {
    setIsActive(false);
    setStageIndex(0);
    setCountdown(stages[0].duration);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                <div className="flex flex-col justify-center">
                    <h3 className="text-3xl font-bold tracking-tight">Box Breathing</h3>
                    <p className="mt-4 text-muted-foreground">A simple technique to calm your nervous system. Follow the visual guide to regulate your breath and reduce stress.</p>
                    <div className="mt-8 space-y-4 text-lg">
                        {stages.map((stage, index) => (
                             <div key={index} className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">{index + 1}</div>
                                <p>{stage.name} for {stage.duration} seconds</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-4">
                        <Button onClick={handleStartPause} size="lg">
                            {isActive ? <Pause className="mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>}
                            {isActive ? 'Pause' : 'Begin Exercise'}
                        </Button>
                         <Button onClick={handleReset} variant="outline" size="lg">
                            <RotateCcw className="mr-2 h-5 w-5"/>
                            Reset
                        </Button>
                    </div>
                </div>
                <BoxBreathingVisualizer stageIndex={stageIndex} countdown={countdown} isActive={isActive} />
            </div>
        </CardContent>
    </Card>
  );
}

// --- Mind Games Components ---

// 1. Guess The Number
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

// 2. Memory Match
const ICONS = [Cat, Dog, Bird, Fish, Rabbit, Turtle, Bug, Snail];
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

interface CardType {
    id: number;
    icon: React.ElementType;
    isFlipped: boolean;
    isMatched: boolean;
}

function MemoryMatchGame() {
    const [cards, setCards] = useState<CardType[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const generateCards = useCallback(() => {
        const icons = ICONS.flatMap((Icon, index) => [
            { id: index * 2, icon: Icon, isFlipped: false, isMatched: false },
            { id: index * 2 + 1, icon: Icon, isFlipped: false, isMatched: false },
        ]);
        setCards(shuffleArray(icons));
        setFlippedIndices([]);
        setMoves(0);
        setGameOver(false);
    }, []);
    
    useEffect(() => {
        generateCards();
    }, [generateCards]);

    const handleCardClick = (index: number) => {
        if (flippedIndices.length === 2 || cards[index].isFlipped) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlippedIndices([...flippedIndices, index]);
    };

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setMoves(prevMoves => prevMoves + 1);
            const [firstIndex, secondIndex] = flippedIndices;
            if (cards[firstIndex].icon === cards[secondIndex].icon) {
                const newCards = [...cards];
                newCards[firstIndex].isMatched = true;
                newCards[secondIndex].isMatched = true;
                setCards(newCards);
                setFlippedIndices([]);
                 if (newCards.every(card => card.isMatched)) {
                    setGameOver(true);
                }
            } else {
                setTimeout(() => {
                    const newCards = [...cards];
                    newCards[firstIndex].isFlipped = false;
                    newCards[secondIndex].isFlipped = false;
                    setCards(newCards);
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    }, [flippedIndices, cards]);

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Memory Match</CardTitle>
                <CardDescription>Match the pairs of cards.</CardDescription>
            </CardHeader>
            <CardContent>
                {gameOver ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-primary">You Win!</h2>
                        <p>You completed the game in {moves} moves.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                        {cards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleCardClick(index)}
                                    className={cn(
                                        'aspect-square rounded-md flex items-center justify-center transition-transform duration-300',
                                        card.isFlipped ? 'bg-primary/20' : 'bg-muted hover:bg-muted/80',
                                        card.isFlipped && 'transform rotate-y-180'
                                    )}
                                >
                                    {card.isFlipped ? <Icon className="w-8 h-8 text-primary" /> : null}
                                </button>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4">
                 <p className="text-sm text-muted-foreground">Moves: {moves}</p>
                 <Button onClick={generateCards} className="w-full">
                     <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Game
                </Button>
            </CardFooter>
        </Card>
    );
}

// 3. Word Unscramble
const WORDS = ['calm', 'breathe', 'happy', 'relax', 'focus', 'peace', 'smile', 'dream'];
const scrambleWord = (word: string) => {
    const a = word.split('');
    const n = a.length;
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.join('');
};

function WordUnscrambleGame() {
    const [currentWord, setCurrentWord] = useState('');
    const [scrambledWord, setScrambledWord] = useState('');
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [isCorrect, setIsCorrect] = useState(false);

    const newWord = useCallback(() => {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        setCurrentWord(word);
        let scrambled = scrambleWord(word);
        while (scrambled === word) {
          scrambled = scrambleWord(word);
        }
        setScrambledWord(scrambled);
        setGuess('');
        setMessage('');
        setIsCorrect(false);
    }, []);

    useEffect(() => {
        newWord();
    }, [newWord]);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (guess.toLowerCase() === currentWord) {
            setMessage('Correct! Well done.');
            setIsCorrect(true);
        } else {
            setMessage('Not quite, try again!');
        }
    };
    
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Word Unscramble</CardTitle>
                <CardDescription>Unscramble the letters to form a word.</CardDescription>
            </CardHeader>
            <form onSubmit={handleGuess}>
                <CardContent className="space-y-4">
                     <div className="text-center text-4xl font-bold tracking-widest uppercase bg-muted p-4 rounded-md">
                        {scrambledWord}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Your guess"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            disabled={isCorrect}
                        />
                         <Button type="submit" disabled={isCorrect}>
                            Check
                        </Button>
                    </div>
                    {message && (
                        <Alert variant={isCorrect ? 'default' : 'destructive'} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                             {isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Lightbulb className="h-4 w-4" />}
                             <AlertTitle>{isCorrect ? 'Success!' : 'Hint'}</AlertTitle>
                             <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </form>
            <CardFooter>
                 <Button onClick={newWord} className="w-full">
                     <RotateCcw className="mr-2 h-4 w-4" />
                    New Word
                </Button>
            </CardFooter>
        </Card>
    );
}

// 4. Tic-Tac-Toe
type Player = 'X' | 'O' | null;

function TicTacToeGame() {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);

    const calculateWinner = (squares: Player[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const winner = calculateWinner(board);
    const isDraw = !winner && board.every(Boolean);

    const handleClick = (i: number) => {
        if (winner || board[i]) return;
        const newBoard = board.slice();
        newBoard[i] = 'X';
        setBoard(newBoard);
        setIsXNext(false); // AI's turn
    };
    
    // Simple AI move
    useEffect(() => {
        if (!isXNext && !winner && !isDraw) {
            const emptySquares = board
                .map((val, idx) => (val === null ? idx : null))
                .filter(val => val !== null);
            
            if (emptySquares.length > 0) {
                 const aiMove = emptySquares[Math.floor(Math.random() * emptySquares.length)] as number;
                 const newBoard = board.slice();
                 setTimeout(() => {
                    newBoard[aiMove] = 'O';
                    setBoard(newBoard);
                    setIsXNext(true);
                 }, 500);
            }
        }
    }, [isXNext, board, winner, isDraw]);

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
    };

    const renderStatus = () => {
        if (winner) return `Winner: ${winner}!`;
        if (isDraw) return "It's a draw!";
        return `Your Turn (X)`;
    };
    
    return (
         <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle>Tic-Tac-Toe</CardTitle>
                <CardDescription>Can you beat the AI?</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-2">
                    {board.map((value, i) => (
                        <Button
                            key={i}
                            variant="outline"
                            className="aspect-square h-auto w-full text-4xl font-bold"
                            onClick={() => handleClick(i)}
                            disabled={!isXNext}
                        >
                            {value === 'X' && <X className="w-10 h-10 text-destructive"/>}
                            {value === 'O' && <Circle className="w-10 h-10 text-primary"/>}
                        </Button>
                    ))}
                </div>
                <div className="mt-4 text-center font-semibold">{renderStatus()}</div>
            </CardContent>
            <CardFooter>
                 <Button onClick={resetGame} className="w-full">
                     <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Game
                </Button>
            </CardFooter>
        </Card>
    );
}

const games = [
    { id: 'guess-the-number', name: 'Guess the Number', component: <GuessTheNumberGame />, description: "I'm thinking of a number between 1 and 100. Can you guess it?" },
    { id: 'memory-match', name: 'Memory Match', component: <MemoryMatchGame />, description: "Test your memory with this classic game. Match pairs of cards to clear the board and improve focus." },
    { id: 'word-unscramble', name: 'Word Unscramble', component: <WordUnscrambleGame />, description: "Unscramble letters to form words. A fun way to boost your vocabulary and cognitive skills." },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', component: <TicTacToeGame />, description: "A simple yet engaging game to challenge your strategic thinking. Play against the AI." },
];


export default function MindfulGamesPage() {
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const SelectedGameComponent = games.find(g => g.id === activeGame)?.component;

  return (
    <>
    <style jsx global>{`
        @keyframes breathe-in {
            0% { transform: scale(0.8); }
            100% { transform: scale(1.2); }
        }
        @keyframes hold {
            0%, 100% { transform: scale(1.2); }
        }
        @keyframes breathe-out {
            0% { transform: scale(1.2); }
            100% { transform: scale(0.8); }
        }
        .animate-breathe-in {
            animation: breathe-in 4s ease-in-out forwards;
        }
        .animate-hold {
             animation: hold 4s ease-in-out forwards;
        }
        .animate-breathe-out {
            animation: breathe-out 4s ease-in-out forwards;
        }
    `}</style>
    <div className="h-full flex flex-col bg-muted/30">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 bg-background">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">Mindful Games</h1>
              <p className="text-sm text-muted-foreground">
                Fun ways to find calm and focus.
              </p>
            </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-12">
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
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-bold tracking-tight">Stress Reduction Tools</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Find calm and focus with our guided exercises and games.</p>
                    </div>
                    <Tabs defaultValue="box-breathing" className="w-full">
                        <TabsList className="flex justify-center -mb-px bg-transparent p-0 gap-8">
                            <TabsTrigger value="box-breathing" className="whitespace-nowrap border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-4 text-base font-semibold data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground rounded-none shadow-none bg-transparent">
                                Box Breathing 
                            </TabsTrigger>
                            <TabsTrigger value="meditation" className="whitespace-nowrap border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-4 text-base font-medium data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground rounded-none shadow-none bg-transparent">
                                Guided Meditation
                            </TabsTrigger>
                            <TabsTrigger value="listening" className="whitespace-nowrap border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent px-4 py-4 text-base font-medium data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary data-[state=inactive]:hover:border-border data-[state=inactive]:hover:text-foreground rounded-none shadow-none bg-transparent">
                            Mindful Listening
                            </TabsTrigger>
                        </TabsList>
                        <div className="border-b border-border/50"></div>
                        <div className="mt-10">
                            <TabsContent value="box-breathing">
                                <BoxBreathingExercise />
                            </TabsContent>
                            <TabsContent value="meditation">
                                <Card className="text-center p-10">
                                    <h3 className="text-2xl font-bold">Guided Meditation</h3>
                                    <p className="text-muted-foreground mt-2">Coming soon! A guided meditation to help you relax and focus.</p>
                                </Card>
                            </TabsContent>
                            <TabsContent value="listening">
                                <Card className="text-center p-10">
                                    <h3 className="text-2xl font-bold">Mindful Listening</h3>
                                    <p className="text-muted-foreground mt-2">Coming soon! An exercise to help you focus on the present moment through sound.</p>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="mt-16 space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight">Mind Games</h2>
                            <p className="mt-2 text-lg text-muted-foreground">Engage your mind with these relaxing and fun games.</p>
                        </div>
                        {games.map(game => (
                            <Card key={game.id} className="bg-card/80 backdrop-blur-sm">
                                <CardContent className="p-8">
                                    <div className="flex flex-col justify-center">
                                        <h3 className="text-2xl font-bold tracking-tight">{game.name}</h3>
                                        <p className="mt-2 text-muted-foreground">{game.description}</p>
                                        <div className="mt-6">
                                            <Button onClick={() => setActiveGame(game.id)}>
                                                Play Now
                                            </Button>
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
    </>
  );
}
