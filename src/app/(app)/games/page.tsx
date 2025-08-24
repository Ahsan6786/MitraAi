
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lightbulb, Gamepad2, Hand, Scissors, Gem, RotateCcw, User, Bot } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// --- Guess the Number Game ---
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
        <Card className="w-full">
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

// --- Tic Tac Toe Game ---
function Square({ value, onSquareClick }: { value: string | null; onSquareClick: () => void; }) {
  return (
    <button
      className="w-16 h-16 sm:w-20 sm:h-20 bg-muted text-3xl font-bold flex items-center justify-center rounded-md hover:bg-muted/80 transition-colors"
      onClick={onSquareClick}
    >
      {value}
    </button>
  );
}

function TicTacToeGame() {
  const [squares, setSquares] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState<'human' | 'ai'>('human');
  const winner = calculateWinner(squares);

  useEffect(() => {
    if (gameMode === 'ai' && !xIsNext && !winner) {
      const aiMove = findBestMove(squares);
      if (aiMove !== -1) {
        setTimeout(() => {
            handleClick(aiMove);
        }, 500); // Small delay to simulate thinking
      }
    }
  }, [xIsNext, squares, gameMode, winner]);


  function handleClick(i: number) {
    if (winner || squares[i]) {
      return;
    }

    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  const handleReset = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  }
  
  const handleModeChange = (mode: 'human' | 'ai') => {
    setGameMode(mode);
    handleReset();
  }

  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else if (!squares.includes(null)) {
    status = 'Draw!';
  }
  else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  return (
     <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                    Tic-Tac-Toe
                </CardTitle>
                <CardDescription>
                   Get three in a row to win. Play against a friend or the AI.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
                <RadioGroup defaultValue="human" onValueChange={handleModeChange} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="human" id="human" />
                        <Label htmlFor="human" className="flex items-center gap-2 cursor-pointer"><User className="w-4 h-4"/> Play vs Human</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ai" id="ai" />
                        <Label htmlFor="ai" className="flex items-center gap-2 cursor-pointer"><Bot className="w-4 h-4"/> Play vs AI</Label>
                    </div>
                </RadioGroup>

               <div className="text-lg font-semibold my-2">{status}</div>
                <div className="grid grid-cols-3 gap-2">
                    {squares.map((_, i) => (
                        <Square key={i} value={squares[i]} onSquareClick={() => handleClick(i)} />
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleReset} className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Game
                 </Button>
            </CardFooter>
        </Card>
  );
}

function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// Simple AI logic for Tic-Tac-Toe
function findBestMove(squares: (string | null)[]) {
    // 1. Check if AI ('O') can win
    for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
            const tempSquares = squares.slice();
            tempSquares[i] = 'O';
            if (calculateWinner(tempSquares) === 'O') {
                return i;
            }
        }
    }
    // 2. Check if player ('X') can win and block
     for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
            const tempSquares = squares.slice();
            tempSquares[i] = 'X';
            if (calculateWinner(tempSquares) === 'X') {
                return i;
            }
        }
    }
    // 3. Take center if available
    if (!squares[4]) {
        return 4;
    }
    // 4. Take a random corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !squares[i]);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    // 5. Take any available square
    const availableSquares = squares.map((sq, i) => sq === null ? i : -1).filter(i => i !== -1);
     if (availableSquares.length > 0) {
        return availableSquares[Math.floor(Math.random() * availableSquares.length)];
    }

    return -1; // Should not happen
}


// --- Rock Paper Scissors Game ---
const choices = [
  { name: 'rock', icon: <Gem className="w-6 h-6 sm:w-8 sm:h-8"/> },
  { name: 'paper', icon: <Hand className="w-6 h-6 sm:w-8 sm:h-8"/> },
  { name: 'scissors', icon: <Scissors className="w-6 h-6 sm:w-8 sm:h-8"/> },
];

function RockPaperScissorsGame() {
    const [userChoice, setUserChoice] = useState<string | null>(null);
    const [computerChoice, setComputerChoice] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const handleUserChoice = (choice: string) => {
        const computersChoice = choices[Math.floor(Math.random() * choices.length)].name;
        setUserChoice(choice);
        setComputerChoice(computersChoice);

        if (choice === computersChoice) {
            setResult("It's a draw!");
        } else if (
            (choice === 'rock' && computersChoice === 'scissors') ||
            (choice === 'paper' && computersChoice === 'rock') ||
            (choice === 'scissors' && computersChoice === 'paper')
        ) {
            setResult('You win!');
        } else {
            setResult('You lose!');
        }
    };
    
    const resetGame = () => {
        setUserChoice(null);
        setComputerChoice(null);
        setResult(null);
    }

    const getIcon = (name: string | null) => choices.find(c => c.name === name)?.icon;

    return (
         <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                    Rock, Paper, Scissors
                </CardTitle>
                <CardDescription>
                   Can you beat the computer? Make your choice!
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                <div className="flex gap-2 sm:gap-4">
                    {choices.map(choice => (
                        <Button key={choice.name} variant="outline" size="lg" onClick={() => handleUserChoice(choice.name)} disabled={!!result} className="w-20 h-20 sm:w-24 sm:h-24">
                            {choice.icon}
                        </Button>
                    ))}
                </div>
                {result && (
                    <div className="text-center space-y-4">
                         <div className="flex items-center justify-center gap-4 sm:gap-8 text-lg font-semibold">
                            <div className="flex flex-col items-center gap-2">
                                <span>You</span>
                                {getIcon(userChoice)}
                            </div>
                            <span className="text-muted-foreground">vs</span>
                             <div className="flex flex-col items-center gap-2">
                                <span>AI</span>
                                {getIcon(computerChoice)}
                            </div>
                         </div>
                         <p className={cn(
                            "text-xl sm:text-2xl font-bold",
                             result === 'You win!' && 'text-green-600',
                             result === 'You lose!' && 'text-red-600',
                             result === "It's a draw!" && 'text-yellow-600',
                         )}>{result}</p>
                    </div>
                )}
            </CardContent>
             <CardFooter>
                 {result && (
                     <Button onClick={resetGame} className="w-full">
                         <RotateCcw className="mr-2 h-4 w-4" />
                         Play Again
                     </Button>
                 )}
            </CardFooter>
        </Card>
    )
}


// --- Main Page Component ---
export default function GamesPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
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
               <Tabs defaultValue="guess-the-number" className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="guess-the-number">Guess Number</TabsTrigger>
                    <TabsTrigger value="tic-tac-toe">Tic-Tac-Toe</TabsTrigger>
                    <TabsTrigger value="rock-paper-scissors">R-P-S</TabsTrigger>
                  </TabsList>
                  <TabsContent value="guess-the-number" className="mt-4">
                     <GuessTheNumberGame />
                  </TabsContent>
                  <TabsContent value="tic-tac-toe" className="mt-4">
                    <TicTacToeGame />
                  </TabsContent>
                  <TabsContent value="rock-paper-scissors" className="mt-4">
                    <RockPaperScissorsGame />
                  </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
