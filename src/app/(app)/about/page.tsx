
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, Heart, BrainCircuit, ShieldCheck, Handshake, FileQuestion, Info } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { SOSButton } from '@/components/sos-button';

function AboutPageContent() {
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">About MitraAI</h1>
                      <p className="text-sm text-muted-foreground">
                          Your Personal Path to Mental Wellness
                      </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to MitraAI</CardTitle>
                        <CardDescription>
                            MitraAI is not just an app — it’s your personal companion for emotional support and self-discovery. In today’s fast-paced world, many of us silently carry stress, anxiety, or even feelings of hopelessness. MitraAI was built with one mission: to listen, understand, and help you feel better, anytime and anywhere.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-6 h-6 text-primary"/> Our Vision
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">We believe mental health is as important as physical health. MitraAI is designed to make emotional wellness accessible, private, and stigma-free for everyone.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Handshake className="w-6 h-6 text-primary"/> Our Mission
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Empower individuals to understand their emotions through AI-driven insights.</li>
                                <li>Encourage seeking help early and reduce the stigma around mental health.</li>
                                <li>Help build stronger emotional connections with themselves and their loved ones.</li>
                           </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="w-6 h-6 text-primary"/> How It Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">Using state-of-the-art AI, MitraAI analyzes the text and tone of your journal entries to identify emotional patterns. This provides you with gentle, data-driven insights to help you reflect on your well-being over time.</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileQuestion className="w-6 h-6 text-primary" /> Clinically Recognized Screening
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-3">
                       <p>
                        To provide a credible starting point for self-assessment, MitraAI utilizes the <strong>Geriatric Depression Scale (GDS – Short Form, 15 items)</strong>. This questionnaire was developed in 1982 by Dr. Jerome Yesavage and his colleagues at the Stanford University School of Medicine.
                       </p>
                       <p>
                        The GDS is a widely recognized, peer-reviewed, and medically accepted screening tool used by doctors, psychologists, and researchers worldwide to help measure depression severity. While it is not a diagnostic tool or a substitute for a professional evaluation, it is a clinically validated instrument that can help guide you on your wellness journey.
                       </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Why MitraAI?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="list-none space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="pt-1"><ShieldCheck className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <h4 className="font-semibold">A Safe Space to Talk</h4>
                                    <p className="text-sm text-muted-foreground">Share your thoughts with our AI companion without fear of judgment.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="pt-1"><ShieldCheck className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <h4 className="font-semibold">Track Your Emotional Health</h4>
                                    <p className="text-sm text-muted-foreground">Through mood journals and voice reflections, visualize your emotional patterns.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <div className="pt-1"><ShieldCheck className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <h4 className="font-semibold">Early Awareness & Support</h4>
                                    <p className="text-sm text-muted-foreground">By analyzing your mood trends, MitraAI gently helps you notice signs of stress or anxiety before they become overwhelming.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <div className="pt-1"><ShieldCheck className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <h4 className="font-semibold">Professional Assistance</h4>
                                    <p className="text-sm text-muted-foreground">Get well-organized reports you can share with mental health experts for better consultations.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <div className="pt-1"><ShieldCheck className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <h4 className="font-semibold">Personalized Growth</h4>
                                    <p className="text-sm text-muted-foreground">MitraAI suggests mindful activities, self-care exercises, and calming games to improve your mental resilience.</p>
                                </div>
                            </li>
                              <li className="flex items-start gap-3">
                                <div className="pt-1"><ShieldCheck className="w-5 h-5 text-primary"/></div>
                                <div>
                                    <h4 className="font-semibold">Privacy First</h4>
                                    <p className="text-sm text-muted-foreground">Your journal is private. All data is securely stored, and you are in complete control of your information.</p>
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Users className="w-6 h-6 text-primary"/> About the Founders – PulseCoders Team
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-muted-foreground">
                        MitraAI was founded by the PulseCoders Team, a group of passionate innovators driven by the belief that technology should heal, not harm. Witnessing how millions silently struggle with mental health challenges due to stigma or lack of accessible support, the team came together with a shared mission: to build a platform where empathy and technology work hand in hand.
                        <br/><br/>
                        With diverse expertise in technology, design, and human behavior, the PulseCoders Team envisions MitraAI as a global companion for anyone feeling lost, anxious, or alone. Their goal goes beyond creating just an app — they aim to build hope, spark conversations, and break the silence around mental health. By making mental wellness accessible to everyone, the team seeks to show that nobody has to fight their battles alone.
                       </p>
                    </CardContent>
                </Card>
                
                 <div className="text-center text-sm text-muted-foreground py-4">
                    <p>MitraAI is not a replacement for therapy, but a supportive companion available 24/7.</p>
                    <p>Your journey to wellness is unique, and we're here to support you every step of the way.</p>
                </div>
            </main>
        </div>
    );
}


export default function AboutPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenAboutIntro';

    useEffect(() => {
        setIsClient(true);
        const hasSeen = sessionStorage.getItem(SESSION_KEY);
        if (hasSeen) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <SectionIntroAnimation 
            onFinish={handleIntroFinish} 
            icon={<Info className="w-full h-full" />}
            title="About MitraAI"
            subtitle="Discover our mission and vision."
        />;
    }

    return <AboutPageContent />;
}
