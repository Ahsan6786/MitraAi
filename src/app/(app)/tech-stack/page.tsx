
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code } from 'lucide-react';

const techData = [
    {
        feature: "Core Application Framework",
        tech: ["Next.js", "React", "TypeScript"],
        explanation: "The entire application is a Next.js app. We use the App Router for file-based routing and layouts. React's component model allows us to build a modular UI, and TypeScript ensures code quality and type safety. We distinguish between Server Components (for performance) and Client Components ('use client') for interactivity."
    },
    {
        feature: "Generative AI Features",
        tech: ["Genkit", "Google Gemini Models"],
        explanation: "All AI capabilities are powered by Genkit, an open-source framework from Google that simplifies building AI-powered features. It connects to various models, but MitraAI primarily uses Google's Gemini family (e.g., Gemini 1.5 Flash for its speed in chat). Genkit flows (defined in `/src/ai/flows`) are implemented as Next.js Server Actions ('use server'), ensuring your API keys and prompts are kept secure on the server."
    },
    {
        feature: "Database and Backend",
        tech: ["Firebase", "Cloud Firestore"],
        explanation: "We use Firebase for our backend needs. Cloud Firestore, a NoSQL database, stores all user data, including profiles, journal entries, chat histories, and community posts. Its real-time capabilities (using `onSnapshot`) mean that data on the screen updates automatically without needing to refresh the page."
    },
    {
        feature: "Authentication",
        tech: ["Firebase Authentication"],
        explanation: "User sign-up and sign-in are handled by Firebase Authentication. It provides a secure and easy way to manage user accounts. The `useAuth` hook in the app provides a simple way to access the current user's state across different components."
    },
    {
        feature: "UI Components & Styling",
        tech: ["ShadCN UI", "Tailwind CSS", "Lucide React"],
        explanation: "The user interface is built with ShadCN UI, a collection of reusable and accessible components. All styling is done using Tailwind CSS, a utility-first CSS framework that allows for rapid styling without writing custom CSS. Icons throughout the app are provided by the Lucide React library."
    },
    {
        feature: "Real-time Voice Interaction (Talk to Mitra)",
        tech: ["Web Speech API", "Text-to-Speech (TTS)"],
        explanation: "The 'Talk to Mitra' feature uses the browser's built-in Web Speech API for speech-to-text transcription. When the AI responds, its text is sent to a Genkit flow that uses a Google AI Text-to-Speech model to generate audio, which is then played back in the browser."
    },
    {
        feature: "Data Visualization (Dashboard)",
        tech: ["Recharts"],
        explanation: "The charts on your Wellness Dashboard are created using the Recharts library. It's a powerful and composable charting library for React that makes it easy to build line and bar charts from your Firestore data."
    },
    {
        feature: "File Storage",
        tech: ["Firebase Cloud Storage"],
        explanation: "When you upload a profile picture or an image in the community feed, the file is securely uploaded to Firebase Cloud Storage. The application then gets a public URL to that file, which is stored in Firestore and used to display the image."
    },
];

export default function TechStackPage() {
    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-lg md:text-xl font-bold">Technology Stack</h1>
                        <p className="text-sm text-muted-foreground">
                            A deep dive into how MitraAI is built.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 lg:p-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center">
                        <Code className="mx-auto w-12 h-12 text-primary mb-4" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Under the Hood of MitraAI</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Here’s a detailed look at the core technologies that power each feature of the application.
                        </p>
                    </div>

                    {techData.map((item, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle>{item.feature}</CardTitle>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {item.tech.map(t => (
                                        <Badge key={t} variant="secondary">{t}</Badge>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{item.explanation}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
