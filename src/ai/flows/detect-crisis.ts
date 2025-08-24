
'use server';

/**
 * @fileOverview A Genkit flow for detecting crisis language in user text.
 *
 * - detectCrisis - A function that analyzes a message for crisis indicators.
 * - DetectCrisisInput - The input type for the detectCrisis function.
 * - DetectCrisisOutput - The return type for the detectCrisis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectCrisisInputSchema = z.object({
  message: z.string().describe('The user message to analyze for crisis indicators.'),
});
export type DetectCrisisInput = z.infer<typeof DetectCrisisInputSchema>;

const DetectCrisisOutputSchema = z.object({
  isCrisis: z.boolean().describe('Whether the message indicates a high risk of self-harm.'),
});
export type DetectCrisisOutput = z.infer<typeof DetectCrisisOutputSchema>;

export async function detectCrisis(input: DetectCrisisInput): Promise<DetectCrisisOutput> {
  return detectCrisisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectCrisisPrompt',
  input: { schema: DetectCrisisInputSchema },
  output: { schema: DetectCrisisOutputSchema },
  prompt: `You are a crisis detection model. Your task is to analyze the user's message for any indication of self-harm or suicidal intent.
  
  Look for keywords such as "suicide", "kill myself", "want to end it", "can't live anymore", "hopeless", "no reason to live", etc.
  
  Based on the presence and severity of these indicators, determine if it constitutes a crisis.
  
  If the message contains clear and immediate suicidal ideation, set isCrisis to true. Otherwise, set it to false.

  User Message: {{{message}}}
  `,
});

const detectCrisisFlow = ai.defineFlow(
  {
    name: 'detectCrisisFlow',
    inputSchema: DetectCrisisInputSchema,
    outputSchema: DetectCrisisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
