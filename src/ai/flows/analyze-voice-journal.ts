
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing the user's mood from a text-based journal entry.
 *
 * - analyzeVoiceJournal - A function that analyzes the user's journal entry transcript.
 * - AnalyzeVoiceJournalInput - The input type for the analyzeVoiceJournal function.
 * - AnalyzeVoiceJournalOutput - The return type for the analyzeVoiceJournal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVoiceJournalInputSchema = z.object({
  transcription: z
    .string()
    .describe(
      "A text transcription of a user's journal entry."
    ),
});
export type AnalyzeVoiceJournalInput = z.infer<typeof AnalyzeVoiceJournalInputSchema>;

const AnalyzeVoiceJournalOutputSchema = z.object({
  mood: z.string().describe('The predicted mood of the user (e.g., happy, sad, anxious).'),
  solutions: z.array(z.string()).describe('A list of supportive solutions or advice based on the user’s mood.'),
});
export type AnalyzeVoiceJournalOutput = z.infer<typeof AnalyzeVoiceJournalOutputSchema>;

export async function analyzeVoiceJournal(input: AnalyzeVoiceJournalInput): Promise<AnalyzeVoiceJournalOutput> {
  return analyzeVoiceJournalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVoiceJournalPrompt',
  input: {schema: AnalyzeVoiceJournalInputSchema},
  output: {schema: AnalyzeVoiceJournalOutputSchema},
  prompt: `You are a mental health assistant. Your task is to analyze a user's journal entry transcription.

  Journal Entry: {{{transcription}}}

  1.  **Determine the Mood**: Analyze the journal entry to determine the user's primary mood (e.g., happy, sad, anxious, angry).
      -   If the transcription is too short, unclear, or lacks emotional content, you MUST default the mood to "Neutral".
      -   Do NOT invent a mood if one is not clearly present.

  2.  **Provide Solutions**:
      -   If a clear mood (like happy, sad, etc.) is detected, provide 3 short, actionable, and supportive solutions or pieces of advice relevant to that mood.
      -   If the mood is "Neutral" because the text was unclear or too short, your solutions MUST be a list of encouraging tips for a better analysis next time, such as:
          - "Try speaking a little more about how your day went."
          - "You could describe a specific event or feeling."
          - "Talking about your hopes or worries can also be helpful."

  You must always return a valid mood and a list of solutions.`,
});

const analyzeVoiceJournalFlow = ai.defineFlow(
  {
    name: 'analyzeVoiceJournalFlow',
    inputSchema: AnalyzeVoiceJournalInputSchema,
    outputSchema: AnalyzeVoiceJournalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
