
'use server';

/**
 * @fileOverview A service for fetching user-related data from Firestore.
 */

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface JournalEntry {
    date: string;
    mood: string;
    content: string;
}

/**
 * Fetches the most recent journal entries for a given user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an object containing the user's journal entries.
 */
export async function getUserJournalEntries(userId: string): Promise<{ entries: JournalEntry[] }> {
    if (!userId) {
        throw new Error("User ID is required to fetch journal entries.");
    }

    try {
        const entriesQuery = query(
            collection(db, 'journalEntries'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20) // Limit to the 20 most recent entries to keep the context manageable
        );

        const querySnapshot = await getDocs(entriesQuery);

        if (querySnapshot.empty) {
            return { entries: [] };
        }

        const entries: JournalEntry[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.createdAt.toDate().toLocaleDateString(),
                mood: data.mood || 'Unknown',
                content: data.content || data.transcription || 'No content',
            };
        });

        return { entries };

    } catch (error) {
        console.error("Error fetching user journal entries:", error);
        // It's often better to return an empty list than to throw an error
        // that crashes the flow, unless the error is critical.
        return { entries: [] };
    }
}
