
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Newspaper, Sparkles, RefreshCw } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateAiNews, GenerateAiNewsOutput } from '@/ai/flows/generate-ai-news';
import { generateImage } from '@/ai/flows/generate-image';
import { useToast } from '@/hooks/use-toast';

interface NewsArticle {
    id: number;
    text: GenerateAiNewsOutput;
    imageUrl: string;
}

const BATCH_SIZE = 3;

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isGenerating, setIsGenerating] = useState(true); // Start generating on load
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const { toast } = useToast();

    const generateAndAddArticles = useCallback(async (count: number) => {
        const isInitialLoad = articles.length === 0;
        if (isInitialLoad) {
            setIsGenerating(true);
        } else {
            setIsGeneratingMore(true);
        }

        try {
            const articlePromises = Array.from({ length: count }).map(async (_, index) => {
                const newsText = await generateAiNews();
                const imageResult = await generateImage({ prompt: newsText.imagePrompt });
                return {
                    id: Date.now() + index, // Simple unique ID
                    text: newsText,
                    imageUrl: imageResult.imageUrl,
                };
            });

            const newArticles = await Promise.all(articlePromises);
            setArticles(prev => [...prev, ...newArticles]);

        } catch (error) {
            console.error("Failed to generate AI news:", error);
            toast({
                title: "Generation Failed",
                description: "Could not generate news articles. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
            setIsGeneratingMore(false);
        }
    }, [toast, articles.length]);
    
    // Initial load
    useEffect(() => {
        // Only run on initial mount if articles are empty
        if (articles.length === 0) {
           generateAndAddArticles(BATCH_SIZE);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    return (
        <div className="h-full flex flex-col">
            <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold">AI News Feed</h1>
                      <p className="text-sm text-muted-foreground">
                          Fresh AI news, generated on demand.
                      </p>
                    </div>
                </div>
                <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {isGenerating && articles.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                            <p className="text-lg font-semibold">Generating your news feed...</p>
                            <p className="text-muted-foreground">This may take a moment.</p>
                        </div>
                    )}
                    
                    <div className="space-y-8">
                        {articles.map((article) => (
                            <Card key={article.id} className="shadow-lg animate-in fade-in-50">
                                <CardHeader className="p-0">
                                    <div className="relative w-full aspect-video rounded-t-lg overflow-hidden bg-muted">
                                        <Image src={article.imageUrl} alt={article.text.headline} layout="fill" objectFit="cover" />
                                    </div>
                                    <div className="p-4 sm:p-6">
                                        <div className="flex items-start sm:items-center gap-3">
                                            <Newspaper className="w-8 h-8 text-primary hidden sm:block" />
                                            <CardTitle className="text-xl sm:text-2xl md:text-3xl">{article.text.headline}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 sm:px-6 pb-6">
                                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                                        {article.text.article}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {!isGenerating && articles.length > 0 && (
                         <div className="text-center py-4">
                            <Button 
                                onClick={() => generateAndAddArticles(BATCH_SIZE)}
                                disabled={isGeneratingMore}
                            >
                                {isGeneratingMore ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4"/>
                                )}
                                {isGeneratingMore ? 'Loading...' : 'Load More News'}
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
