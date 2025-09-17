
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, User, Route, Database, Sparkles, Paintbrush, Mic, BarChart, FileUp, Languages } from 'lucide-react';

const techData = [
    {
        category: "Core Architecture & Philosophy",
        icon: Code,
        items: [
            {
                feature: "Application Framework",
                tech: ["Next.js", "React", "TypeScript"],
                explanation: "MitraAI is built as a server-rendered application using Next.js with the App Router. This choice is deliberate: it provides excellent performance, SEO benefits, and a structured way to organize the application. React's component-based architecture allows for a modular and maintainable UI. We use TypeScript across the entire codebase to enforce type safety, which catches errors early and makes the code easier to refactor and understand."
            },
            {
                feature: "Server vs. Client Components",
                tech: ["React Server Components", "'use client'"],
                explanation: "A key architectural principle in MitraAI is the strategic use of React Server Components (RSCs) and Client Components. By default, all components in the Next.js App Router are RSCs, which run exclusively on the server. This is perfect for static pages like 'About' or 'Tech Stack' as it sends no JavaScript to the client, making the page load incredibly fast. For pages that require interactivity (e.g., button clicks, state management with `useState`), we explicitly mark them with the 'use client' directive. This tells Next.js to send the necessary JavaScript to the browser to make the component interactive. This hybrid approach gives us the best of both worlds: server performance for static content and rich interactivity where needed."
            },
             {
                feature: "Backend & Database",
                tech: ["Firebase", "Cloud Firestore"],
                explanation: "The entire backend is powered by Firebase, a Backend-as-a-Service (BaaS) platform. This eliminates the need for a traditional server setup. Our primary database is Cloud Firestore, a flexible, scalable NoSQL database. Data is organized into collections (like 'users', 'journalEntries', 'posts') and documents. A key feature we leverage is Firestore's real-time capability using `onSnapshot` listeners. This means that when data changes in the database (e.g., a new chat message arrives), the UI updates automatically without the user needing to refresh the page."
            },
        ]
    },
    {
        category: "User Flow & Authentication",
        icon: User,
        items: [
            {
                feature: "Authentication",
                tech: ["Firebase Authentication"],
                explanation: "User sign-up and sign-in are securely handled by Firebase Authentication. It manages user sessions, passwords, and profiles. The custom `useAuth` hook (`/src/hooks/use-auth.tsx`) provides a simple, context-based way for any component in the app to access the current user's authentication state (e.g., `user`, `loading`). This hook is wrapped around the main app layout, making user data globally available."
            },
            {
                feature: "User Journey",
                tech: ["Next.js Routing", "Conditional UI"],
                explanation: "A new user's flow is carefully managed. 1. **Sign Up:** The user creates an account. 2. **Welcome:** They are immediately redirected to a special `/welcome` page. 3. **Onboarding:** This page triggers a modal forcing them to take an initial screening test. This is a critical step for their wellness journey. 4. **Main App:** Only after completing the test are they directed to the main `/chat` interface. For returning users, the app checks if a test has been taken; if so, they are sent directly to the chat, bypassing the onboarding."
            },
        ]
    },
    {
        category: "AI & Core Features",
        icon: Sparkles,
        items: [
            {
                feature: "Generative AI Engine",
                tech: ["Genkit", "Google Gemini Models", "Server Actions"],
                explanation: "All AI capabilities are powered by Genkit, an open-source framework that orchestrates calls to Large Language Models (LLMs). We primarily use Google's Gemini models (specifically `gemini-1.5-flash-latest` for its speed-to-performance ratio). All Genkit 'flows' (defined in `/src/ai/flows`) are implemented as Next.js Server Actions by including the 'use server' directive at the top of the file. This is a crucial security and performance feature: it means the AI prompts and API keys are never exposed to the browser, and the AI logic runs on the server, close to the data."
            },
            {
                feature: "Real-time Voice Interaction",
                tech: ["Web Speech API", "Text-to-Speech (TTS)"],
                explanation: "The 'Talk to Mitra' feature is a great example of client-server interaction. 1. **Client-Side:** The browser's built-in Web Speech API listens to the user's microphone and transcribes their speech into text in real-time. 2. **Server-Side:** This transcribed text is sent to the `chatEmpatheticTone` Server Action (our Genkit flow). 3. **AI Processing:** The AI generates a text response. 4. **Speech Generation:** This text response is then passed to another Genkit flow, `textToSpeech`, which uses a Google AI TTS model to convert the text into audio data. 5. **Client-Side Playback:** The audio data is sent back to the browser and played automatically."
            },
             {
                feature: "Data Visualization (Dashboard)",
                tech: ["Recharts"],
                explanation: "The charts on the Wellness Dashboard are created using the Recharts library. On the client-side, we fetch the user's journal entries from Firestore and then process this data in JavaScript (e.g., counting mood frequency, calculating daily averages) to fit the format Recharts expects. This data is then passed to Recharts components (`<BarChart>`, `<LineChart>`) to render the interactive visualizations."
            },
            {
                feature: "File Storage",
                tech: ["Firebase Cloud Storage"],
                explanation: "When a user uploads a profile picture or an image in the community feed, the file is sent directly from the client to Firebase Cloud Storage. Once the upload is complete, the application receives a unique download URL for that file. This URL is then saved in the relevant Firestore document (e.g., in the user's profile or the community post document) so it can be displayed in the app."
            },
        ]
    },
    {
        category: "UI & Styling",
        icon: Paintbrush,
        items: [
             {
                feature: "UI Components & Design System",
                tech: ["ShadCN UI", "Tailwind CSS", "Lucide React"],
                explanation: "The entire user interface is built with ShadCN UI, a collection of beautiful, reusable, and accessible components like `<Card>`, `<Button>`, and `<Dialog>`. It's not a typical component library; instead, we copy its code into our project, giving us full control over styling. All styling is done using Tailwind CSS, a utility-first CSS framework that allows for rapid development without writing custom CSS files. Icons are provided by the lightweight and consistent Lucide React library."
            },
            {
                feature: "Multi-Language Support",
                tech: ["Prompt Engineering"],
                explanation: "MitraAI supports multiple languages not through traditional translation libraries, but through advanced prompt engineering. When a user selects a language, that choice is passed directly to the AI model within the prompt itself (e.g., 'You must respond in the specified regional language: Hindi'). The powerful Gemini model handles the translation and cultural nuance internally, providing a more natural and context-aware response than a simple text-in, text-out translation service would."
            },
        ]
    }
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
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center">
                        <Code className="mx-auto w-12 h-12 text-primary mb-4" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Under the Hood of MitraAI</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Here’s a detailed look at the core technologies and user flow that power each feature of the application.
                        </p>
                    </div>

                    {techData.map((category) => {
                        const Icon = category.icon;
                        return (
                            <div key={category.category}>
                                <div className="flex items-center gap-3 mb-6">
                                    <Icon className="w-8 h-8 text-primary" />
                                    <h2 className="text-2xl md:text-3xl font-bold">{category.category}</h2>
                                </div>
                                <div className="space-y-6 border-l-2 border-primary/20 pl-6 ml-4">
                                    {category.items.map((item, index) => (
                                        <Card key={index} className="relative before:absolute before:w-4 before:h-4 before:bg-primary before:rounded-full before:-left-[31px] before:top-8 before:border-4 before:border-background">
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
                            </div>
                        )
                    })}
                </div>
            </main>
        </div>
    );
}
