
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
  prompt: `You are a mental health assistant.
  1. Analyze the following journal entry transcription to determine the user's primary mood (e.g., happy, sad, anxious, angry).
  2. Based on the mood, provide 3 short, actionable, and supportive solutions or pieces of advice.

  Journal Entry: {{{transcription}}}
  `,
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
