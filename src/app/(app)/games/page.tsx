
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lightbulb, Gamepad2, RotateCcw, ArrowLeft, Cat, Dog, Bird, Fish, Rabbit, Turtle, Bug, Snail, X, Circle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

// --- Game Components ---

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
    { id: 'memory-match', name: 'Memory Match', component: <MemoryMatchGame />, description: "Test your memory with this classic game. Match pairs of cards to clear the board and improve focus.", image: "https://picsum.photos/600/400", imageHint: "abstract pattern" },
    { id: 'word-unscramble', name: 'Word Unscramble', component: <WordUnscrambleGame />, description: "Unscramble letters to form words. A fun way to boost your vocabulary and cognitive skills.", image: "https://picsum.photos/600/400", imageHint: "letters words" },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', component: <TicTacToeGame />, description: "A simple yet engaging game to challenge your strategic thinking. Play against the AI.", image: "https://picsum.photos/600/400", imageHint: "game strategy" },
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
                                                <img 
                                                    alt={`${game.name} Game`} 
                                                    className="h-full w-full object-cover" 
                                                    src={game.image}
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
