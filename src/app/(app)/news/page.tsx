
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Newspaper, Sparkles } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateAiNews, GenerateAiNewsOutput } from '@/ai/flows/generate-ai-news';
import { generateImage } from '@/ai/flows/generate-image';
import { useToast } from '@/hooks/use-toast';

interface NewsArticle {
    text: GenerateAiNewsOutput;
    imageUrl: string;
}

export default function NewsPage() {
    const [article, setArticle] = useState<NewsArticle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerateNews = async () => {
        setIsLoading(true);
        setArticle(null);

        try {
            // Generate the text and image prompt first
            const newsText = await generateAiNews();
            
            // Generate the image using the prompt from the text flow
            const imageResult = await generateImage({ prompt: newsText.imagePrompt });

            // Set the complete article with image URL at the same time
            setArticle({
                text: newsText,
                imageUrl: imageResult.imageUrl,
            });

        } catch (error) {
            console.error("Failed to generate AI news:", error);
            toast({
                title: "Generation Failed",
                description: "Could not generate the news article. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">AI News Flash</h1>
                      <p className="text-sm text-muted-foreground">
                          Fresh AI news with images, generated on demand.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle>Generate Real-Time AI News</CardTitle>
                            <CardDescription>
                                Click the button below to get a fresh news article, complete with an AI-generated image.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleGenerateNews} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isLoading ? 'Generating Article...' : 'Get Latest News'}
                            </Button>
                        </CardContent>
                    </Card>

                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    )}

                    {article && (
                        <Card className="shadow-lg animate-in fade-in-50">
                            <CardHeader>
                                <div className="relative w-full aspect-video rounded-t-lg overflow-hidden">
                                    <Image src={article.imageUrl} alt={article.text.headline} layout="fill" objectFit="cover" />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3">
                                        <Newspaper className="w-8 h-8 text-primary hidden sm:block" />
                                        <CardTitle className="text-2xl md:text-3xl">{article.text.headline}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                                    {article.text.article}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
