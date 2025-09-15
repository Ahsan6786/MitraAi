
'use client';

import { BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Hourglass } from 'lucide-react';
import { useUsageTracker } from '@/hooks/use-usage-tracker';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UsageTracker() {
    const { usage, dailyLimitSeconds } = useUsageTracker();
    
    if (!usage) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hourglass className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    const percentage = (usage.timeSpentSeconds / dailyLimitSeconds) * 100;
    const minutesLeft = Math.round((dailyLimitSeconds - usage.timeSpentSeconds) / 60);

    let BatteryIcon = BatteryFull;
    let colorClass = 'text-green-500';
    if (percentage > 90) {
        BatteryIcon = BatteryWarning;
        colorClass = 'text-red-500';
    } else if (percentage > 60) {
        BatteryIcon = BatteryLow;
        colorClass = 'text-orange-500';
    } else if (percentage > 30) {
        BatteryIcon = BatteryMedium;
        colorClass = 'text-yellow-500';
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-default">
                        <BatteryIcon className={`w-6 h-6 ${colorClass}`} />
                        <span>{minutesLeft > 0 ? `${minutesLeft} min left` : "Time's up"}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Daily app usage limit. Encouraging mindful technology use.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
