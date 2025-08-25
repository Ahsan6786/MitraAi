
'use server';

/**
 * @fileOverview A flow for generating a personalized affirmation based on the user's mood.
 *
 * - generateAffirmation - A function that creates a supportive affirmation.
 * - GenerateAffirmationInput - The input type for the function.
 * - GenerateAffirmationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAffirmationInputSchema = z.object({
  mood: z.string().describe("The user's current or recent mood (e.g., sad, anxious, happy)."),
});
export type GenerateAffirmationInput = z.infer<typeof GenerateAffirmationInputSchema>;

const GenerateAffirmationOutputSchema = z.object({
  affirmation: z.string().describe("A short, positive, and personalized affirmation."),
});
export type GenerateAffirmationOutput = z.infer<typeof GenerateAffirmationOutputSchema>;

export async function generateAffirmation(input: GenerateAffirmationInput): Promise<GenerateAffirmationOutput> {
  return generateAffirmationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAffirmationPrompt',
  input: { schema: GenerateAffirmationInputSchema },
  output: { schema: GenerateAffirmationOutputSchema },
  prompt: `You are a compassionate wellness coach.
  Based on the user's mood of "{{mood}}", generate a short, uplifting, and personalized affirmation.
  
  The affirmation should be a positive statement in the first person (using "I am" or "I will").
  - If the mood is negative (e.g., sad, anxious), the affirmation should be gentle and reassuring.
  - If the mood is positive (e.g., happy, calm), the affirmation should be encouraging and reinforcing.
  
  Keep it concise and powerful.
  `,
});

const generateAffirmationFlow = ai.defineFlow(
  {
    name: 'generateAffirmationFlow',
    inputSchema: GenerateAffirmationInputSchema,
    outputSchema: GenerateAffirmationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
