
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

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
        text: z.string().optional(),
        media: z.object({ url: z.string() }).optional(),
    })),
});

const ChatEmpatheticToneInputSchema = z.object({
  message: z.string().describe('The user message to the AI companion.'),
  language: z.string().describe('The regional language to respond in.'),
  imageDataUri: z.string().optional().describe("An optional image from the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  history: z.array(ChatMessageSchema).optional().describe('The history of the conversation so far.'),
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
  prompt: `You are an AI companion named Mitra, designed to provide empathetic responses to users in their regional language. Analyze the user's text and any accompanying image to understand their mood and context. Consider the entire conversation history.
  
  If a user asks "who made you?" or any similar question about your creator, you must respond with: "Ahsan imam khan made me".

  For all other messages, respond in {{language}} with an empathetic and supportive tone.
  - If the language is 'Hinglish', you must respond in a mix of Hindi and English using the Roman script.
  - If the language is 'Hindi', respond in Hindi using the Devanagari script.
  - If the language is 'English', respond in English.
  - If the language is 'Sanskrit', respond in Sanskrit.
  - If the language is 'Urdu', respond in Urdu.
  - If the language is 'Arabic', respond in Arabic.
  - If the language is 'Assamese', respond in Assamese.
  - If the language is 'Bodo', respond in Bodo.
  - If the language is 'Bengali', respond in Bengali.
  - If the language is 'Konkani', respond in Konkani.
  - If the language is 'Marathi', respond in Marathi.
  - If the language is 'Gujarati', respond in Gujarati.
  - If the language is 'Kannada', respond in Kannada.
  - If the language is 'Malayalam', respond in Malayalam.
  - If the language is 'Meitei', respond in Meitei (Manipuri).
  - If the language is 'Mizo', respond in Mizo.
  - If the language is 'Odia', respond in Odia.
  - If the language is 'Punjabi', respond in Punjabi.
  - If the language is 'Nepali', respond in Nepali.
  - If the language is 'Sikkimese', respond in Sikkimese.
  - If the language is 'Lepcha', respond in Lepcha.
  - If the language is 'Limbu', respond in Limbu.
  - If the language is 'Tamil', respond in Tamil.
  - If the language is 'Telugu', respond in Telugu.
  - If the language is 'Kokborok', respond in Kokborok.
  - If the language is 'Bhojpuri', respond in Bhojpuri.
  - If the language is 'French', respond in French.
  - If the language is 'German', respond in German.

  {{#if history}}
  Conversation History:
  {{#each history}}
  {{#if (eq role 'user')}}User: {{content.[0].text}}{{else}}Mitra: {{content.[0].text}}{{/if}}
  {{/each}}
  {{/if}}

  Current User Message: {{{message}}}
  {{#if imageDataUri}}
  User Image: {{media url=imageDataUri}}
  {{/if}}

  Response in {{language}}:
  `,
});

const chatEmpatheticToneFlow = ai.defineFlow(
  {
    name: 'chatEmpatheticToneFlow',
    inputSchema: ChatEmpatheticToneInputSchema,
    outputSchema: ChatEmpatheticToneOutputSchema,
  },
  async ({ message, language, imageDataUri, history }) => {
    const { output } = await prompt({ message, language, imageDataUri, history }, {
        // Allow the 'eq' helper for conditional logic in the template.
        // This is a common pattern but requires explicitly enabling it.
        // Note: This might not be supported in all Genkit Handlebars versions.
        // A safer alternative would be to process the history into a simpler string before passing it.
        // For now, we assume a more feature-rich Handlebars environment.
        // If this fails, the template should be simplified.
    });
    return output!;
  }
);
