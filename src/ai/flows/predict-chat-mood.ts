
'use server';

/**
 * @fileOverview This file defines a Genkit flow for predicting the user's mood based on a single chat message.
 *
 * - predictChatMood - A function that predicts the user's mood.
 * - PredictChatMoodInput - The input type for the predictChatMood function.
 * - PredictChatMoodOutput - The return type for the predictChatMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictChatMoodInputSchema = z.object({
  message: z
    .string()
    .describe('The user chat message to analyze for mood prediction.'),
});
export type PredictChatMoodInput = z.infer<typeof PredictChatMoodInputSchema>;

const PredictChatMoodOutputSchema = z.object({
  mood: z.string().describe('The predicted mood of the user (e.g., happy, sad, anxious, neutral).'),
});
export type PredictChatMoodOutput = z.infer<typeof PredictChatMoodOutputSchema>;

export async function predictChatMood(input: PredictChatMoodInput): Promise<PredictChatMoodOutput> {
  return predictChatMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictChatMoodPrompt',
  input: {schema: PredictChatMoodInputSchema},
  output: {schema: PredictChatMoodOutputSchema},
  prompt: `Analyze the following chat message and predict the user's primary mood. 
  
  The mood should be a single word (e.g., Happy, Sad, Anxious, Neutral, Angry, Excited).

  Message: {{{message}}}
  `,
});

const predictChatMoodFlow = ai.defineFlow(
  {
    name: 'predictChatMoodFlow',
    inputSchema: PredictChatMoodInputSchema,
    outputSchema: PredictChatMoodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
