
'use server';

/**
 * @fileOverview A flow for chatting with an AI companion in a regional language with an empathetic tone.
 * This flow also includes crisis detection.
 *
 * - chatEmpatheticTone - A function that handles the chat with empathetic tone.
 * - ChatEmpatheticToneInput - The input type for the chatEmpatheticTone function.
 * - ChatEmpatheticToneOutput - The return type for the chatEmpatheticTone function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { detectCrisis } from './detect-crisis';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const ChatEmpatheticToneInputSchema = z.object({
  message: z.string().describe('The user message to the AI companion.'),
  language: z.string().describe('The regional language to respond in (e.g., English, Hindi, Hinglish).'),
  userId: z.string().describe('The unique ID of the user.'),
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
  async ({ message, language, userId }) => {
    // 1. Get the empathetic response from the AI
    const { output } = await prompt({ message, language, userId });
    const response = output!;

    // 2. In parallel, check for a crisis
    const crisisCheck = await detectCrisis({ message });

    if (crisisCheck.isCrisis) {
      // 3. If a crisis is detected, check user's consent and get trusted contacts
      const userProfileRef = doc(db, 'userProfiles', userId);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists() && userProfileSnap.data().consentForAlerts) {
        const contactsCollectionRef = collection(db, 'userProfiles', userId, 'trustedContacts');
        const contactsSnapshot = await getDocs(contactsCollectionRef);
        
        if (!contactsSnapshot.empty) {
          const contacts = contactsSnapshot.docs.map(doc => doc.data());
          // 4. Create an alert for each contact
          for (const contact of contacts) {
            await addDoc(collection(db, 'alerts'), {
              userId: userId,
              triggeredAt: serverTimestamp(),
              contactEmail: contact.email,
              status: 'pending', // A backend process would pick this up
            });
          }
        }
      }
    }

    return response;
  }
);
