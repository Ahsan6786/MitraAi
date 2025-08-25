
'use server';

/**
 * @fileOverview A flow for generating supportive suggestions based on a user's mood.
 *
 * - generateSuggestions - A function that creates a list of suggestions.
 * - GenerateSuggestionsInput - The input type for the function.
 * - GenerateSuggestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSuggestionsInputSchema = z.object({
  mood: z.string().describe("The user's detected mood (e.g., sad, anxious, happy)."),
});
export type GenerateSuggestionsInput = z.infer<typeof GenerateSuggestionsInputSchema>;

const GenerateSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("A list of 3 short, actionable, and supportive suggestions relevant to the user's mood."),
});
export type GenerateSuggestionsOutput = z.infer<typeof GenerateSuggestionsOutputSchema>;

export async function generateSuggestions(input: GenerateSuggestionsInput): Promise<GenerateSuggestionsOutput> {
  return generateSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSuggestionsPrompt',
  input: { schema: GenerateSuggestionsInputSchema },
  output: { schema: GenerateSuggestionsOutputSchema },
  prompt: `You are a mental health assistant. Your task is to provide supportive suggestions based on a user's mood.
  
  User's Mood: {{{mood}}}
  
  - If a clear mood (like happy, sad, etc.) is detected, provide 3 short, actionable, and supportive suggestions or pieces of advice relevant to that mood.
  - If the mood is "Neutral" because the user's input was unclear or too short, your suggestions MUST be a list of encouraging tips for a better analysis next time, such as:
      - "Try speaking a little more about how your day went."
      - "You could describe a specific event or feeling."
      - "Talking about your hopes or worries can also be helpful."
  
  You must always return a list of 3 suggestions.`,
});

const generateSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSuggestionsFlow',
    inputSchema: GenerateSuggestionsInputSchema,
    outputSchema: GenerateSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
