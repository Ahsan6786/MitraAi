
'use server';
/**
 * @fileOverview A multi-modal AI flow to predict user's mood from voice and video.
 *
 * - predictLiveMood - A function that handles the live mood prediction.
 * - PredictLiveMoodInput - The input type for the predictLiveMood function.
 * - PredictLiveMoodOutput - The return type for the predictLiveMood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictLiveMoodInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A snapshot from the user's camera, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe("The transcribed text from the user's voice."),
});
export type PredictLiveMoodInput = z.infer<typeof PredictLiveMoodInputSchema>;

const PredictLiveMoodOutputSchema = z.object({
  response: z.string().describe("The AI's empathetic and conversational response based on the user's mood."),
});
export type PredictLiveMoodOutput = z.infer<typeof PredictLiveMoodOutputSchema>;

export async function predictLiveMood(input: PredictLiveMoodInput): Promise<PredictLiveMoodOutput> {
  return predictLiveMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictLiveMoodPrompt',
  input: { schema: PredictLiveMoodInputSchema },
  output: { schema: PredictLiveMoodOutputSchema },
  prompt: `You are an empathetic AI companion. Your task is to analyze the user's mood based on a snapshot of their face and their spoken words.
  
  1.  **Analyze the image:** Look at the user's facial expression in the photo.
  2.  **Analyze the text:** Read the user's transcribed message.
  3.  **Synthesize:** Combine the insights from both the image and the text to understand the user's overall emotional state.
  4.  **Respond:** Formulate a short, kind, and supportive conversational response. Your response should acknowledge their feelings and offer encouragement or a gentle question. Do not just state their mood; talk to them like a friend.

  User's Words: "{{{description}}}"
  User's Appearance: {{media url=photoDataUri}}
  `,
});

const predictLiveMoodFlow = ai.defineFlow(
  {
    name: 'predictLiveMoodFlow',
    inputSchema: PredictLiveMoodInputSchema,
    outputSchema: PredictLiveMoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
