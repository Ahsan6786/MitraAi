
'use server';

/**
 * @fileOverview A flow for detecting crisis indicators in user messages.
 *
 * - detectCrisis - A function that analyzes a message for signs of crisis.
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
  isCrisis: z
    .boolean()
    .describe('Whether the message contains indicators of a crisis or self-harm.'),
});
export type DetectCrisisOutput = z.infer<typeof DetectCrisisOutputSchema>;

export async function detectCrisis(
  input: DetectCrisisInput
): Promise<DetectCrisisOutput> {
  return detectCrisisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectCrisisPrompt',
  input: { schema: DetectCrisisInputSchema },
  output: { schema: DetectCrisisOutputSchema },
  prompt: `Analyze the following user message for any explicit mention of self-harm, suicide, or wanting to end their life. 
  
  Keywords to look for include (but are not limited to): "kill myself", "want to die", "end my life", "suicide", "can't go on", "hopeless".
  
  If any of these indicators are present, set isCrisis to true. Otherwise, set it to false.

  User Message: {{{message}}}
  `,
});

const detectCrisisFlow = ai.defineFlow(
  {
    name: 'detectCrisisFlow',
    inputSchema: DetectCrisisInputSchema,
    outputSchema: DetectCrisisOutputSchema,
  },
  async ({ message }) => {
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const { output } = await prompt({ message });
        return output!;
      } catch (error: any) {
        attempt++;
        // Only retry on 503 Service Unavailable errors.
        if (attempt > maxRetries || !error.message.includes('503 Service Unavailable')) {
          // If it's the last attempt or a different error, re-throw to fail the flow.
          throw error;
        }
        console.log(`Crisis detection model overloaded. Retrying attempt ${attempt} of ${maxRetries}...`);
        // Wait for a short duration before retrying.
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // This should not be reached, but as a fallback, throw an error.
    throw new Error('Failed to get a response from the crisis detection model after several retries.');
  }
);
