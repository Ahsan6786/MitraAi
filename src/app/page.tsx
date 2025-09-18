
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { Bot, HeartPulse, Mic, FileText, Instagram, Mail, AlertTriangle, ShieldCheck, Handshake, Users, PlayCircle, FileQuestion, ArrowUp, MessageSquare, Hourglass } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GenZToggle } from '@/components/genz-toggle';
import IntroAnimation from '@/components/intro-animation';
import { ScrollAnimate } from '@/components/scroll-animate';

// --- Interactive Hero Section Component ---
function InteractiveHero() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    // This prevents the hydration error.
    setIsClient(true);
  }, []);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden flex items-center justify-center text-center bg-muted/20">
      
      {/* Words floating around - only render on client */}
      {isClient && ['Anxiety', 'Stress', 'Overwhelm', 'Loneliness', 'Doubt', 'Burnout', 'Worry', 'Pressure'].map((word, index) => (
        <span
          key={index}
          className={cn(
            'absolute transition-all duration-700 ease-out text-muted-foreground/30 font-bold',
             'text-2xl md:text-3xl lg:text-4xl',
            isHovered ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          )}
          style={{ 
             top: `${10 + (index % 4) * 20 + Math.random() * 10}%`,
             left: `${15 + (index % 5) * 15 + Math.random() * 10}%`,
           }}
        >
          {word}
        </span>
      ))}

      {/* Central orb and text */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center cursor-pointer p-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glowing orb effect */}
        <div className={cn(
          'absolute inset-[-50px] bg-primary/30 rounded-full transition-all duration-700 ease-out blur-2xl',
          isHovered ? 'scale-[2.5] opacity-50' : 'scale-100 opacity-80'
        )}></div>
        
         <div className="relative z-20 transition-all duration-700 ease-out">
            {/* Initial Prompt */}
            <div className={cn(
                "transition-opacity duration-500",
                isHovered ? "opacity-0" : "opacity-100"
            )}>
                 <div className="text-4xl font-bold sm:text-5xl md:text-6xl text-center space-y-2">
                    <div>Unleash</div>
                    <div>Your</div>
                    <div>Warrior</div>
                </div>
            </div>
            
            {/* Content Revealed on Hover */}
            <div className={cn(
                "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500",
                isHovered ? "opacity-100" : "opacity-0"
            )}>
                <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl md:text-2xl mt-6">
                    You are a warrior. You have chosen MitraAI for your well-being.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}


function LandingPageContent() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled up to a certain amount
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set up event listener
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'MitraGPT',
      description: 'Talk about your feelings in a safe space with our empathetic AI, available in multiple languages.',
    },
    {
      icon: <HeartPulse className="w-8 h-8 text-primary" />,
      title: 'Mood Journal',
      description: 'Track your emotions by writing journal entries. Our AI helps you identify and understand your mood patterns.',
    },
    {
      icon: <Mic className="w-8 h-8 text-primary" />,
      title: 'Voice Journal',
      description: 'Simply speak your mind. Our technology transcribes and analyzes your voice notes to provide insights.',
    },
    {
      icon: <FileText className="w-8 h-8 text-primary" />,
      title: "Doctor's Reports",
      description: 'Share your progress with your doctor, who can review your entries and provide professional feedback.',
    },
  ];
  
  const missionItems = [
      {
          title: "Empowerment Through Insight",
          description: "Empower individuals to understand their emotions through AI-driven insights."
      },
      {
          title: "Reduce Stigma",
          description: "Encourage seeking help early and reduce the stigma around mental health."
      },
      {
          title: "Build Connections",
          description: "Help build stronger emotional connections with themselves and their loved ones."
      }
  ];

  const whyUsItems = [
      {
          title: "A Safe Space to Talk",
          description: "Share your thoughts with our AI companion without fear of judgment."
      },
      {
          title: "Track Your Emotional Health",
          description: "Through mood journals and voice reflections, visualize your emotional patterns."
      },
      {
          title: "Early Awareness & Support",
          description: "MitraAI gently helps you notice signs of stress or anxiety before they become overwhelming."
      },
      {
          title: "Mindful Usage",
          description: "We encourage balanced technology use with a built-in daily timer to help you disconnect and recharge."
      },
      {
          title: "Privacy First",
          description: "Your journal is private. All data is securely stored, and you are in complete control of your information."
      }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">MitraAI</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <GenZToggle />
          <ThemeToggle />
           <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex">
            <Link href="#tutorial" prefetch={false}>
              Tutorial
            </Link>
          </Button>
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
        
        {/* Interactive Hero Section */}
        <section className="w-full">
            <InteractiveHero />
            <div className="container mx-auto px-4 md:px-6 text-center -mt-20 relative z-10">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild>
                      <Link href="/signup" prefetch={false}>
                        Get Started for Free
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link 
                        href="https://www.instagram.com/mitra____ai?igsh=MThuMDBkYnE5cGl1dQ%3D%3D&utm_source=qr"
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
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20 mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <ScrollAnimate>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Toolkit for Your Wellbeing</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    MitraAI provides a suite of tools designed to help you reflect, understand, and grow.
                  </p>
                </div>
              </div>
            </ScrollAnimate>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <ScrollAnimate key={feature.title} className="h-full" style={{ animationDelay: `${index * 150}ms` }}>
                  <Card className="text-center flex flex-col h-full">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                        {feature.icon}
                      </div>
                      <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>
        
        <section id="screening-tool" className="w-full py-12 md:py-24">
            <div className="container mx-auto grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
                <ScrollAnimate>
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm w-fit">Medically Accepted Screening</div>
                        <CardTitle className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mt-2">Grounded in Science</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            MitraAI integrates the Geriatric Depression Scale (GDS), a clinically validated and medically accepted screening tool developed at Stanford University School of Medicine. It is used worldwide by doctors and researchers to help measure depression severity.
                        </p>
                        <p className="text-sm text-muted-foreground mt-4">
                            While not a diagnostic tool, the GDS provides a reliable, peer-reviewed starting point for understanding your mental health.
                        </p>
                    </CardContent>
                  </Card>
                </ScrollAnimate>
                <ScrollAnimate style={{ animationDelay: '150ms' }}>
                  <div className="flex flex-col gap-4">
                      <Card className="h-full">
                          <CardHeader className="flex-row items-center gap-4">
                              <FileQuestion className="w-8 h-8 text-primary" />
                              <div>
                                  <CardTitle>Screen Your Depression/Anxiety</CardTitle>
                                  <CardDescription>Take the first step towards understanding your well-being.</CardDescription>
                              </div>
                          </CardHeader>
                          <CardContent>
                              <Button asChild className="w-full">
                                  <Link href="/signup">Sign Up to Take the Test</Link>
                              </Button>
                          </CardContent>
                      </Card>
                  </div>
                </ScrollAnimate>
            </div>
        </section>

        <section id="mission" className="w-full py-12 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
               <ScrollAnimate>
                 <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Mission</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Building a Healthier Tomorrow</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We believe mental health is as important as physical health. MitraAI is designed to make emotional wellness accessible, private, and stigma-free for everyone.
                    </p>
                 </div>
               </ScrollAnimate>
               <div className="flex flex-col items-start space-y-4">
                    <ScrollAnimate className="inline-flex items-center rounded-lg bg-muted p-3">
                       <Handshake className="h-6 w-6 text-primary" />
                    </ScrollAnimate>
                    <ul className="grid gap-4">
                       {missionItems.map((item, index) => (
                           <ScrollAnimate asChild key={index} style={{ animationDelay: `${index * 150}ms` }}>
                               <li>
                                  <h3 className="text-lg font-bold">{item.title}</h3>
                                  <p className="text-muted-foreground">{item.description}</p>
                               </li>
                           </ScrollAnimate>
                       ))}
                    </ul>
                 </div>
            </div>
          </div>
        </section>
        
         <section id="why-us" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
             <ScrollAnimate>
               <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Why MitraAI?</div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Your Personal Path to Wellness</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Discover the features that make MitraAI a unique companion for your mental health journey.
                  </p>
                </div>
              </div>
            </ScrollAnimate>
            <ScrollAnimate>
              <Card className="mt-12">
                <CardContent className="p-8">
                  <div className="mx-auto max-w-2xl items-center">
                    <div className="flex flex-col justify-center space-y-4">
                      <ul className="grid gap-6">
                        {whyUsItems.map((item, index) => (
                            <ScrollAnimate asChild key={index} style={{ animationDelay: `${index * 150}ms` }}>
                                <li className="flex items-start gap-3">
                                    <div className="pt-1">
                                      {item.title === "Mindful Usage" ? <Hourglass className="w-5 h-5 text-primary"/> : <ShieldCheck className="w-5 h-5 text-primary"/>}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                </li>
                            </ScrollAnimate>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimate>
          </div>
        </section>

        <section id="tutorial" className="w-full py-12 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <ScrollAnimate>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                   <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">How It Works</div>
                   <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl flex items-center justify-center gap-3">
                      <PlayCircle className="w-8 h-8 md:w-10 md:h-10 text-primary"/>
                      See MitraAI in Action
                   </h2>
                   <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                     Watch this short tutorial to see how you can start your wellness journey with MitraAI.
                   </p>
                </div>
                <div className="w-full max-w-4xl mx-auto mt-8">
                  <div className="aspect-video overflow-hidden rounded-xl border shadow-lg">
                     <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/pu0Ekbo13Dg"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                  </div>
                </div>
              </div>
            </ScrollAnimate>
          </div>
        </section>
        
        <section id="founder" className="w-full py-12 md:py-24">
           <div className="container mx-auto px-4 md:px-6">
            <ScrollAnimate>
               <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
                           <Users className="w-8 h-8 text-primary"/> About the Founders – PulseCoders Team
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-muted-foreground md:text-lg/relaxed">
                        MitraAI was founded by the PulseCoders Team, a group of passionate innovators driven by the belief that technology should heal, not harm. Witnessing how millions silently struggle with mental health challenges due to stigma or lack of accessible support, the team came together with a shared mission: to build a platform where empathy and technology work hand in hand.
                        <br/><br/>
                        With diverse expertise in technology, design, and human behavior, the PulseCoders Team envisions MitraAI as a global companion for anyone feeling lost, anxious, or alone. Their goal goes beyond creating just an app — they aim to build hope, spark conversations, and break the silence around mental health. By making mental wellness accessible to everyone, the team seeks to show that nobody has to fight their battles alone.
                       </p>
                    </CardContent>
                </Card>
              </ScrollAnimate>
           </div>
        </section>

        <section id="disclaimer" className="w-full py-12 md:py-24 bg-muted/20">
           <div className="container mx-auto px-4 md:px-6">
             <ScrollAnimate>
                <div className="mx-auto max-w-3xl text-center">
                   <div className="flex justify-center mb-4">
                      <AlertTriangle className="w-10 h-10 text-amber-500" />
                   </div>
                   <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">A Gentle Reminder</h2>
                   <p className="text-muted-foreground md:text-lg/relaxed mt-4">
                      MitraAI is here to be a supportive friend on your journey of self-discovery. It's a safe space to explore your thoughts and talk with someone when you are alone. However, please remember that this app is not a substitute for professional medical advice, diagnosis, or treatment, and its analysis may not be 100% correct. Always seek the advice of a qualified health provider with any questions you may have regarding a medical condition.
                   </p>
                </div>
              </ScrollAnimate>
           </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2025 MitraAI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link 
              href="https://www.instagram.com/mitra____ai?igsh=MThuMDBkYnE5cGl1dQ%3D%3D&utm_source=qr"
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
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
          size="icon"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}


export default function LandingPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        setIsClient(true);
        // Use sessionStorage to only show the intro once per session
        const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
        if (hasSeenIntro) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem('hasSeenIntro', 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null; // Render nothing on the server to avoid hydration mismatch
    }

    if (showIntro) {
        return <IntroAnimation onFinish={handleIntroFinish} />;
    }
    
    return <LandingPageContent />;
}

    