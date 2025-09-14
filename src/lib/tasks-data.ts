
export interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    actionUrl?: string; // Optional URL for tasks that link to a specific page
}

export const tasksData: Task[] = [
    {
        id: 'complete-profile',
        title: 'Complete Your Profile',
        description: 'Fill out all the details in your profile, including your name, age, and a profile picture.',
        reward: 50,
        actionUrl: '/profile',
    },
    {
        id: 'first-journal-entry',
        title: 'First Journal Entry',
        description: 'Write and save your first journal entry to start tracking your mood.',
        reward: 20,
        actionUrl: '/journal',
    },
    {
        id: 'try-live-mood',
        title: 'Try Live Mood Analysis',
        description: 'Use the live mood analysis feature for the first time to see real-time insights.',
        reward: 30,
        actionUrl: '/live-mood',
    },
    {
        id: 'book-appointment',
        title: 'Book a Counsellor',
        description: 'Schedule your first appointment with one of our professional counsellors.',
        reward: 100,
        actionUrl: '/booking',
    },
    {
        id: 'join-community',
        title: 'Join the Community',
        description: 'Make your first post in the community feed to connect with others.',
        reward: 40,
        actionUrl: '/community',
    },
    {
        id: 'daily-affirmation',
        title: 'Daily Affirmation',
        description: 'Visit the affirmations page and generate a new affirmation to start your day positively.',
        reward: 10,
        actionUrl: '/affirmations',
    }
];
