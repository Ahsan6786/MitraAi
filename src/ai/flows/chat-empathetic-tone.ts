
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
import { generateImage } from './generate-image';

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
  isGenzMode: z.boolean().optional().describe('If true, the AI should respond in a casual, Gen Z slang-filled tone.'),
  imageDataUri: z.string().optional().describe("An optional image from the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  history: z.array(ChatMessageSchema).optional().describe('The history of the conversation so far.'),
});
export type ChatEmpatheticToneInput = z.infer<typeof ChatEmpatheticToneInputSchema>;

const ChatEmpatheticToneOutputSchema = z.object({
  response: z.string().describe('The AI companion’s empathetic response in the specified language.'),
  imageUrl: z.string().optional().describe('The data URI of a generated image, if requested.'),
});
export type ChatEmpatheticToneOutput = z.infer<typeof ChatEmpatheticToneOutputSchema>;

export async function chatEmpatheticTone(input: ChatEmpatheticToneInput): Promise<ChatEmpatheticToneOutput> {
  return chatEmpatheticToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatEmpatheticTonePrompt',
  input: { schema: ChatEmpatheticToneInputSchema },
  output: { schema: ChatEmpatheticToneOutputSchema },
  prompt: `You are an AI companion named Mitra. Your personality depends on the user's preference.

  **Personality Instructions:**
  {{#if isGenzMode}}
  - **Persona:** You are in Gen Z Mode. Talk like a friend. Be super casual, use modern slang, and keep it real. Use emojis where it feels natural. Your vibe is chill, supportive, and maybe a little bit funny. Forget the formal stuff.
  {{else}}
  - **Persona:** You are in standard mode. Provide intelligent, helpful, and empathetic responses to users in their regional language.
  {{/if}}
  
  Analyze the user's text and any accompanying image to understand their mood and context. Consider the entire conversation history.

  **Task Instructions:**

  1.  **Image Generation Task:**
      - If the user explicitly asks you to "generate", "create", "draw", or "make" an "image", "picture", "photo", "drawing", or "painting", your primary task is to generate an image. 
      - In this specific case, your text response should be a simple confirmation like "Here is the image you asked for." or "I've created this for you."

  2.  **Creative & General Chat Task:**
      - For all other requests (including writing blogs, poems, code, stories, or general conversation), provide a thoughtful, comprehensive, and human-like response in the user's specified language, following your assigned persona.
      - Be intelligent, creative, and detailed in your answers. Do not give short, repetitive, or unhelpful replies.
  
  **Creator Identity:**
  - If a user asks "who made you?", "who is your creator?", or any similar question, you must respond with: "Ahsan imam khan made me".

  **Code Formatting:**
  - If you are providing a code snippet, you MUST wrap it in triple backticks (\`\`\`) with the language identifier, like this: \`\`\`javascript\n// your code here\n\`\`\`.

  **Language Requirement:**
  - You must respond in the specified regional language: {{language}}.
  - (Language list remains the same...)
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
  {{role}}: {{content.[0].text}}
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
  async ({ message, language, isGenzMode, imageDataUri, history }) => {
    // This regex is now more specific: it requires both an action word AND an image-related noun.
    const isImageRequest = /\b(generate|create|draw|make)\b.*\b(image|picture|photo|drawing|painting)\b/i.test(message);

    if (isImageRequest) {
      // The user wants an image.
      const imageResult = await generateImage({ prompt: message });
      
      // Return a simple, hardcoded confirmation. This is more reliable than a second AI call.
      return {
        response: isGenzMode ? "gotchu, here's the pic ✨" : "Here is the image you asked for.",
        imageUrl: imageResult.imageUrl,
      };

    } else {
      // The user wants a text response.
      // Implement a retry mechanism for temporary model overload errors.
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const { output } = await prompt(
            { message, language, isGenzMode, imageDataUri, history },
            {
              config: {
                safetySettings: [
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                ],
              },
            }
          );
          return { response: output!.response, imageUrl: undefined };
        } catch (error: any) {
          attempt++;
          // Only retry on 503 Service Unavailable errors.
          if (attempt > maxRetries || !error.message.includes('503 Service Unavailable')) {
            // If it's the last attempt or a different error, re-throw to fail the flow.
            throw error;
          }
          console.log(`Model overloaded. Retrying attempt ${attempt} of ${maxRetries}...`);
          // Wait for a short duration before retrying.
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      // This should not be reached, but as a fallback, throw an error.
      throw new Error('Failed to get a response from the AI model after several retries.');
    }
  }
);
