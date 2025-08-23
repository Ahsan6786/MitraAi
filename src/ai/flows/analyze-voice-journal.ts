'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing the user's mood from a voice journal entry.
 *
 * - analyzeVoiceJournal - A function that analyzes the user's voice journal.
 * - AnalyzeVoiceJournalInput - The input type for the analyzeVoiceJournal function.
 * - AnalyzeVoiceJournalOutput - The return type for the analyzeVoiceJournal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVoiceJournalInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A voice recording of a journal entry, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVoiceJournalInput = z.infer<typeof AnalyzeVoiceJournalInputSchema>;

const AnalyzeVoiceJournalOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the voice journal entry.'),
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
  1. Transcribe the following audio journal entry.
  2. Analyze the transcription to determine the user's primary mood (e.g., happy, sad, anxious, angry).
  3. Based on the mood, provide 3 short, actionable, and supportive solutions or pieces of advice.

  Audio Entry: {{media url=audioDataUri}}
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
