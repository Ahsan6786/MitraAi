
'use server';

/**
 * @fileOverview A flow for generating a short, descriptive title for a chat conversation.
 *
 * - generateChatTitle - A function that creates a title from the first message.
 * - GenerateChatTitleInput - The input type for the function.
 * - GenerateChatTitleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateChatTitleInputSchema = z.object({
  message: z.string().describe("The first user message in a new conversation."),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe("A concise, 2-4 word title that summarizes the message."),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: { schema: GenerateChatTitleInputSchema },
  output: { schema: GenerateChatTitleOutputSchema },
  prompt: `Generate a very short, 2-4 word title for the following user message. The title should capture the main topic or question.

  Examples:
  - Message: "Can you help me write a blog post about the benefits of meditation?" -> Title: "Meditation Blog Post"
  - Message: "I'm feeling really anxious about my exams next week." -> Title: "Anxiety About Exams"
  - Message: "Draw me a picture of a futuristic city." -> Title: "Futuristic City Drawing"

  User Message: "{{message}}"
  `,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
