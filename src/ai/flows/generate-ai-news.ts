
'use server';

/**
 * @fileOverview A flow for generating a news article about a recent development in AI.
 *
 * - generateAiNews - A function that creates a news article.
 * - GenerateAiNewsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAiNewsOutputSchema = z.object({
  headline: z.string().describe("A compelling, short headline for the news article."),
  article: z.string().describe("The full text of the news article, written in an engaging journalistic style."),
});
export type GenerateAiNewsOutput = z.infer<typeof GenerateAiNewsOutputSchema>;

export async function generateAiNews(): Promise<GenerateAiNewsOutput> {
  return generateAiNewsFlow();
}

const prompt = ai.definePrompt({
  name: 'generateAiNewsPrompt',
  output: { schema: GenerateAiNewsOutputSchema },
  prompt: `You are a tech journalist specializing in Artificial Intelligence.
  
  Write a short news article (around 3-4 paragraphs) about a single, recent, and interesting development in the world of AI. 
  
  Focus on a real event, product launch, research paper, or significant update from the last few months.
  
  The tone should be engaging, informative, and accessible to a general audience.
  
  Generate a catchy headline and the full article text.`,
});

const generateAiNewsFlow = ai.defineFlow(
  {
    name: 'generateAiNewsFlow',
    outputSchema: GenerateAiNewsOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
