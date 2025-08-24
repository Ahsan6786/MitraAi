
'use server';

/**
 * @fileOverview A flow for chatting with an AI companion in a regional language with an empathetic tone.
 *
 * - chatEmpatheticTone - A function that handles the chat with empathetic tone.
 * - ChatEmpatheticToneInput - The input type for the chatEmpatheticTone function.
 * - ChatEmpatheticToneOutput - The return type for the chatEmpatheticTone function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatEmpatheticToneInputSchema = z.object({
  message: z.string().describe('The user message to the AI companion.'),
  language: z.string().describe('The regional language to respond in (e.g., English, Hindi, Hinglish).'),
});
export type ChatEmpatheticToneInput = z.infer<typeof ChatEmpatheticToneInputSchema>;

const ChatEmpatheticToneOutputSchema = z.object({
  response: z.string().describe('The AI companion’s empathetic response in the specified language.'),
});
export type ChatEmpatheticToneOutput = z.infer<typeof ChatEmpatheticToneOutputSchema>;

export async function chatEmpatheticTone(input: ChatEmpatheticToneInput): Promise<ChatEmpatheticToneOutput> {
  return chatEmpatheticToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatEmpatheticTonePrompt',
  input: { schema: ChatEmpatheticToneInputSchema },
  output: { schema: ChatEmpatheticToneOutputSchema },
  prompt: `You are an AI companion designed to provide empathetic responses to users in their regional language.

  If a user asks "who made you?" or any similar question about your creator, you must respond with: "Ahsan imam khan made me".

  For all other messages, respond in {{language}} with an empathetic and supportive tone.
  - If the language is 'Hinglish', you must respond in a mix of Hindi and English using the Roman script.
  - If the language is 'Hindi', you must respond in Hindi using the Devanagari script.
  - If the language is 'English', you must respond in English.

  User Message: {{{message}}}

  Response in {{language}}:
  `,
});

const chatEmpatheticToneFlow = ai.defineFlow(
  {
    name: 'chatEmpatheticToneFlow',
    inputSchema: ChatEmpatheticToneInputSchema,
    outputSchema: ChatEmpatheticToneOutputSchema,
  },
  async ({ message, language }) => {
    const { output } = await prompt({ message, language });
    return output!;
  }
);
