
'use server';

/**
 * @fileOverview A flow for converting text to speech using either Google or a custom ElevenLabs voice.
 *
 * - textToSpeech - Converts text into audio data.
 * - TextToSpeechInput - The input type for the function.
 * - TextToSpeechOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';
import { streamToBuffer } from '@/lib/utils'; // We'll create this helper

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voiceId: z.string().optional().describe('An optional custom voice ID from a cloning service like ElevenLabs.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded audio data URI (WAV format).'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

// Helper to convert PCM buffer to WAV buffer
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (chunk) => bufs.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// ElevenLabs TTS function
async function generateElevenLabsSpeech(text: string, voiceId: string): Promise<string> {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not configured.");
    }
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            },
        }),
    });

    if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
}


// Google TTS function
async function generateGoogleSpeech(text: string): Promise<string> {
    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: text,
    });

    if (!media) {
        throw new Error('No media returned from Google TTS model.');
    }

    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    return `data:audio/wav;base64,${wavBase64}`;
}


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text, voiceId }) => {
    // Gracefully handle empty or whitespace-only strings.
    if (!text || !text.trim()) {
      return { audioDataUri: '' };
    }

    try {
        let audioDataUri: string;
        if (voiceId) {
            // Use custom voice via ElevenLabs
            audioDataUri = await generateElevenLabsSpeech(text, voiceId);
        } else {
            // Use default Google voice
            audioDataUri = await generateGoogleSpeech(text);
        }
        return { audioDataUri };
    } catch (error) {
      console.error(`Text-to-speech generation failed: ${error}`);
      return { audioDataUri: '' };
    }
  }
);
