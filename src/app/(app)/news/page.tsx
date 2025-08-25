
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Newspaper, Sparkles, Image as ImageIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateAiNews, GenerateAiNewsOutput } from '@/ai/flows/generate-ai-news';
import { generateImage } from '@/ai/flows/generate-image';
import { useToast } from '@/hooks/use-toast';

export default function NewsPage() {
    const [news, setNews] = useState<GenerateAiNewsOutput | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const { toast } = useToast();

    const handleGenerateNews = async () => {
        setIsGeneratingText(true);
        setIsGeneratingImage(false);
        setNews(null);
        setImageUrl(null);

        try {
            const result = await generateAiNews();
            setNews(result);
            // Once text is loaded, trigger image generation
            setIsGeneratingImage(true);
        } catch (error) {
            console.error("Failed to generate AI news text:", error);
            toast({
                title: "Text Generation Failed",
                description: "Could not generate the news article. Please try again.",
                variant: "destructive",
            });
            setIsGeneratingText(false);
        } finally {
            setIsGeneratingText(false);
        }
    };

    useEffect(() => {
        const generateAndSetImage = async () => {
            if (isGeneratingImage && news?.imagePrompt) {
                try {
                    const imageResult = await generateImage({ prompt: news.imagePrompt });
                    setImageUrl(imageResult.imageUrl);
                } catch (error) {
                     console.error("Failed to generate AI news image:", error);
                     toast({
                        title: "Image Generation Failed",
                        description: "Could not generate an image for the article.",
                        variant: "destructive",
                    });
                } finally {
                    setIsGeneratingImage(false);
                }
            }
        };
        generateAndSetImage();
    }, [isGeneratingImage, news, toast]);

    const isLoading = isGeneratingText || isGeneratingImage;

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
                                {isGeneratingText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isGeneratingText ? 'Generating Article...' : 'Get Latest News'}
                            </Button>
                        </CardContent>
                    </Card>

                    {isGeneratingText && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    )}

                    {news && (
                        <Card className="shadow-lg animate-in fade-in-50">
                            <CardHeader>
                                {isGeneratingImage && (
                                     <div className="bg-muted w-full aspect-video rounded-t-lg flex items-center justify-center">
                                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin"/>
                                            <p>Generating image...</p>
                                        </div>
                                     </div>
                                )}
                                {imageUrl && (
                                    <div className="relative w-full aspect-video rounded-t-lg overflow-hidden">
                                        <Image src={imageUrl} alt={news.headline} layout="fill" objectFit="cover" />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-3">
                                        <Newspaper className="w-8 h-8 text-primary hidden sm:block" />
                                        <CardTitle className="text-2xl md:text-3xl">{news.headline}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                                    {news.article}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
