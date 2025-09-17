
'use server';

/**
 * @fileOverview A flow for cloning a user's voice using ElevenLabs.
 *
 * - cloneVoice - Creates a voice clone from an audio sample.
 * - CloneVoiceInput - The input type for the function.
 * - CloneVoiceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Readable } from 'stream';

const CloneVoiceInputSchema = z.object({
  audioDataUri: z.string().describe("A user's voice recording, as a data URI."),
  userId: z.string().describe("The unique ID of the user."),
  userName: z.string().describe("The name of the user for labeling the voice."),
});
export type CloneVoiceInput = z.infer<typeof CloneVoiceInputSchema>;

const CloneVoiceOutputSchema = z.object({
  voiceId: z.string().describe("The new unique ID for the cloned voice."),
});
export type CloneVoiceOutput = z.infer<typeof CloneVoiceOutputSchema>;


async function addVoiceToElevenLabs(userName: string, audioBuffer: Buffer): Promise<string> {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not configured.");
    }

    const formData = new FormData();
    formData.append('name', `${userName}'s Voice Clone`);
    formData.append('files', new Blob([audioBuffer], { type: 'audio/webm' }), 'voice_sample.webm');

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: formData,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.voice_id;
}


export async function cloneVoice(input: CloneVoiceInput): Promise<CloneVoiceOutput> {
  return cloneVoiceFlow(input);
}

const cloneVoiceFlow = ai.defineFlow(
  {
    name: 'cloneVoiceFlow',
    inputSchema: CloneVoiceInputSchema,
    outputSchema: CloneVoiceOutputSchema,
  },
  async ({ userId, userName, audioDataUri }) => {
    // 1. Convert data URI to Buffer
    const base64Data = audioDataUri.split(',')[1];
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // 2. Call ElevenLabs API
    const voiceId = await addVoiceToElevenLabs(userName, audioBuffer);
    
    // 3. Save the new voiceId to the user's profile in Firestore
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { customVoiceId: voiceId }, { merge: true });

    return { voiceId };
  }
);
