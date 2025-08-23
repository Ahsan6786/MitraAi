'use server';

/**
 * @fileOverview This file defines a Genkit flow for predicting the user's mood based on their journal entries.
 *
 * - predictUserMood - A function that predicts the user's mood.
 * - PredictUserMoodInput - The input type for the predictUserMood function.
 * - PredictUserMoodOutput - The return type for the predictUserMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictUserMoodInputSchema = z.object({
  journalEntry: z
    .string()
    .describe('The user journal entry to analyze for mood prediction.'),
});
export type PredictUserMoodInput = z.infer<typeof PredictUserMoodInputSchema>;

const PredictUserMoodOutputSchema = z.object({
  mood: z.string().describe('The predicted mood of the user (e.g., happy, sad, anxious).'),
  confidence: z
    .number()
    .describe('The confidence level of the mood prediction (0 to 1).'),
});
export type PredictUserMoodOutput = z.infer<typeof PredictUserMoodOutputSchema>;

export async function predictUserMood(input: PredictUserMoodInput): Promise<PredictUserMoodOutput> {
  return predictUserMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictUserMoodPrompt',
  input: {schema: PredictUserMoodInputSchema},
  output: {schema: PredictUserMoodOutputSchema},
  prompt: `Analyze the following journal entry and predict the user's mood. Return the mood and a confidence level between 0 and 1.

Journal Entry: {{{journalEntry}}}

Mood: 
Confidence: `,
});

const predictUserMoodFlow = ai.defineFlow(
  {
    name: 'predictUserMoodFlow',
    inputSchema: PredictUserMoodInputSchema,
    outputSchema: PredictUserMoodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
