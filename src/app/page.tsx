import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Welcome to MitraAI</CardTitle>
          <CardDescription className="pt-2">Your empathetic mental health companion, here to listen and support you in your own language.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-center text-muted-foreground mb-6">
            Begin your journey towards mindfulness and well-being.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/chat">Get Started Anonymously</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
