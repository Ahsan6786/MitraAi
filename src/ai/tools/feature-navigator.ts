
'use server';
/**
 * @fileOverview A Genkit tool for navigating to different features within the MitraAI app.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const featureNavigator = ai.defineTool(
  {
    name: 'featureNavigator',
    description: "Use this tool to find the correct page for a MitraAI app feature when a user asks for help, how to do something, or where to find a feature. This helps guide users within the application.",
    inputSchema: z.object({
        featureQuery: z.string().describe("The user's query about a specific feature (e.g., 'live mood analysis', 'talk to Mitra', 'write in my journal')."),
    }),
    outputSchema: z.object({
        featureName: z.string().describe("The name of the identified feature (e.g., 'Live Mood Analysis', 'Journal')."),
        path: z.string().describe("The URL path for the feature within the app (e.g., '/live-mood', '/journal')."),
    }),
  },
  async ({ featureQuery }) => {
    const query = featureQuery.toLowerCase();

    // Map keywords to features
    if (query.includes('live') || query.includes('camera') || query.includes('video mood')) {
        return { featureName: 'Live Mood Analysis', path: '/live-mood' };
    }
    if (query.includes('talk') || query.includes('speak') || query.includes('voice chat')) {
        return { featureName: 'Talk to Mitra', path: '/talk' };
    }
    if (query.includes('journal') || query.includes('write') || query.includes('diary')) {
        return { featureName: 'Journal', path: '/journal' };
    }
    if (query.includes('dashboard') || query.includes('stats') || query.includes('progress')) {
        return { featureName: 'Dashboard', path: '/dashboard' };
    }
    if (query.includes('book') || query.includes('appointment') || query.includes('counsellor')) {
        return { featureName: 'Booking', path: '/booking' };
    }
    if (query.includes('report') || query.includes('doctor')) {
        return { featureName: "Doctor's Reports", path: '/reports' };
    }
    if (query.includes('game') || query.includes('puzzle') || query.includes('breathing')) {
        return { featureName: 'Mindful Games', path: '/mindful-games' };
    }
    if (query.includes('community') || query.includes('post') || query.includes('friends') || query.includes('group')) {
        return { featureName: 'Community', path: '/community' };
    }
     if (query.includes('news')) {
        return { featureName: 'AI News', path: '/news' };
    }
    if (query.includes('vr') || query.includes('therapy') || query.includes('360')) {
        return { featureName: '360° VR Therapy', path: '/therapy' };
    }
    if (query.includes('affirmation')) {
        return { featureName: 'Affirmations', path: '/affirmations' };
    }
    if (query.includes('test') || query.includes('screening') || query.includes('questionnaire')) {
        return { featureName: 'Screening Tools', path: '/screening-tools' };
    }
     if (query.includes('about')) {
        return { featureName: 'About MitraAI', path: '/about' };
    }
     if (query.includes('profile') || query.includes('setting')) {
        return { featureName: 'Profile', path: '/profile' };
    }
     if (query.includes('culture')) {
        return { featureName: 'Culture', path: '/culture' };
    }

    return { featureName: 'Chat', path: '/chat' }; // Default fallback
  }
);
