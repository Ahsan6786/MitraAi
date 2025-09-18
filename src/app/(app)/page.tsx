
import { redirect } from 'next/navigation';

export default function AppPage() {
  // This page is now the entry point for the authenticated app zone.
  // It redirects users to the main chat page by default.
  redirect('/chat');
}

    