
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { MessageSquare, BookHeart, MicVocal, FileText } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: 'AI Companion Chat',
      description: 'Talk about your feelings in a safe space with our empathetic AI, available in multiple languages.',
    },
    {
      icon: <BookHeart className="w-8 h-8 text-primary" />,
      title: 'Mood Journal',
      description: 'Track your emotions by writing journal entries. Our AI helps you identify and understand your mood patterns.',
    },
    {
      icon: <MicVocal className="w-8 h-8 text-primary" />,
      title: 'Voice Journal',
      description: 'Simply speak your mind. Our technology transcribes and analyzes your voice notes to provide insights.',
    },
    {
      icon: <FileText className="w-8 h-8 text-primary" />,
      title: "Doctor's Reports",
      description: 'Share your progress with your doctor, who can review your entries and provide professional feedback.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">MitraAI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/signin" prefetch={false}>
              Sign In
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your Personal Path to Mental Wellness
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    MitraAI is your compassionate AI companion, here to listen, understand, and support you on your mental health journey.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/signup" prefetch={false}>
                      Get Started for Free
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/hero-image.png"
                width="600"
                height="400"
                alt="AI doctor and patient"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Toolkit for Your Wellbeing</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  MitraAI provides a suite of tools designed to help you reflect, understand, and grow.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 MitraAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
