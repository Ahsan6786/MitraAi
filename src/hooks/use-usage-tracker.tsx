
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { format } from 'date-fns';

const DAILY_LIMIT_SECONDS = 3600; // 1 hour
const UPDATE_INTERVAL_MS = 30000; // 30 seconds

interface DailyUsage {
    timeSpentSeconds: number;
    lastUpdated: any;
}

export function useUsageTracker() {
    const { user } = useAuth();
    const [usage, setUsage] = useState<DailyUsage | null>(null);
    const [timeLimitExceeded, setTimeLimitExceeded] = useState(false);

    const getTodaysDocId = () => {
        return format(new Date(), 'yyyy-MM-dd');
    };

    const updateUsage = useCallback(async (seconds: number) => {
        if (!user) return;
        const todayId = getTodaysDocId();
        const usageDocRef = doc(db, `users/${user.uid}/dailyUsage`, todayId);
        
        try {
            await setDoc(usageDocRef, {
                timeSpentSeconds: increment(seconds),
                lastUpdated: serverTimestamp(),
            }, { merge: true });
        } catch (error) {
            console.error("Error updating usage time:", error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const checkUsage = async () => {
            const todayId = getTodaysDocId();
            const usageDocRef = doc(db, `users/${user.uid}/dailyUsage`, todayId);
            const docSnap = await getDoc(usageDocRef);

            let currentUsage: DailyUsage;

            if (docSnap.exists()) {
                currentUsage = docSnap.data() as DailyUsage;
            } else {
                currentUsage = { timeSpentSeconds: 0, lastUpdated: new Date() };
                await setDoc(usageDocRef, currentUsage);
            }
            
            if (!isMounted) return;

            setUsage(currentUsage);

            if (currentUsage.timeSpentSeconds >= DAILY_LIMIT_SECONDS) {
                setTimeLimitExceeded(true);
                if (intervalId) clearInterval(intervalId);
            } else {
                intervalId = setInterval(() => {
                    updateUsage(UPDATE_INTERVAL_MS / 1000);
                    // Optimistically update local state to reflect new usage
                    setUsage(prev => {
                        const newTime = (prev?.timeSpentSeconds || 0) + (UPDATE_INTERVAL_MS / 1000);
                        if (newTime >= DAILY_LIMIT_SECONDS) {
                            setTimeLimitExceeded(true);
                            clearInterval(intervalId);
                        }
                        return { ...prev!, timeSpentSeconds: newTime };
                    });
                }, UPDATE_INTERVAL_MS);
            }
        };

        checkUsage();

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [user, updateUsage]);
    
    return { usage, timeLimitExceeded, dailyLimitSeconds: DAILY_LIMIT_SECONDS };
}
