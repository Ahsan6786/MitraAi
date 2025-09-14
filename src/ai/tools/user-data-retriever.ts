
'use server';
/**
 * @fileOverview A Genkit tool for retrieving a user's journal entries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserJournalEntries } from '@/services/user-data';

export const userDataRetriever = ai.defineTool(
  {
    name: 'userDataRetriever',
    description: "Retrieves a user's journal entries from the database to analyze their mood and well-being over time. Use this tool when the user asks about their emotional history, patterns, or wants a summary of their feelings.",
    inputSchema: z.object({
        userId: z.string().describe("The unique ID of the user whose data should be fetched."),
    }),
    outputSchema: z.object({
        entries: z.array(z.object({
            date: z.string().describe("The date of the entry."),
            mood: z.string().describe("The mood detected for the entry."),
            content: z.string().describe("The text content of the journal entry."),
        })).describe("A list of the user's journal entries."),
    }),
  },
  async ({ userId }) => {
    return getUserJournalEntries(userId);
  }
);
