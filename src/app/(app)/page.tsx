
import { redirect } from 'next/navigation';

export default function AppPage() {
  // The root of the app is now handled by the redirect in next.config.ts
  // This page can be used as a future authenticated dashboard if needed.
  // For now, redirecting to /chat ensures a consistent user experience.
  redirect('/chat');
}
