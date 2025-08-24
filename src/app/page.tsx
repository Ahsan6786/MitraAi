
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { MessageSquare, BookHeart, MicVocal, FileText, Instagram, Mail, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from '@/components/theme-provider';

function LandingPageContent() {
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
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild size="sm">
            <Link href="/signin" prefetch={false}>
              Sign In
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl/none">
                  Your Personal Path to Mental Wellness
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-base sm:text-lg md:text-xl">
                  MitraAI is your compassionate AI companion, here to listen and support you 24/7. While a doctor provides professional guidance, your AI friend is always here for you, anytime, anywhere.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup" prefetch={false}>
                    Get Started for Free
                  </Link>
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <Link 
                    href="https://www.instagram.com/mitraai1?igsh=MThuMDBkYnE5cGl1dQ%3D%3D&utm_source=qr"
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                  <Link href="mailto:mitraai0001@gmail.com" prefetch={false}>
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Email</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="disclaimer" className="w-full py-12 md:py-24">
           <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-3xl text-center">
                 <div className="flex justify-center mb-4">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                 </div>
                 <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">A Gentle Reminder</h2>
                 <p className="text-muted-foreground md:text-lg/relaxed mt-4">
                    MitraAI is here to be a supportive friend on your journey of self-discovery. It's a safe space to explore your thoughts and talk with someone when you are alone. However, please remember that this app is not a substitute for professional medical advice, diagnosis, or treatment, and its analysis may not be 100% correct. Always seek the advice of a qualified health provider with any questions you may have regarding a medical condition.
                 </p>
              </div>
           </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
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
            <div className="mx-auto grid max-w-5xl items-start gap-6 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>

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
        <p className="text-xs text-muted-foreground">&copy; 2025 MitraAI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link 
              href="https://www.instagram.com/mitraai1?igsh=MThuMDBkYnE5cGl1dQ%3D%3D&utm_source=qr"
              className="text-muted-foreground hover:text-foreground"
              prefetch={false}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link 
              href="mailto:mitraai0001@gmail.com"
              className="text-muted-foreground hover:text-foreground"
              prefetch={false}
            >
              <Mail className="h-5 w-5" />
              <span className="sr-only">Email</span>
            </Link>
        </nav>
      </footer>
    </div>
  );
}


export default function LandingPage() {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <LandingPageContent />
        </ThemeProvider>
    )
}
