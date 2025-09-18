
import { redirect } from 'next/navigation';

export default function AppPage() {
  // Redirect authenticated users from the root of the authenticated zone ('/app')
  // to the main chat page. The public landing page is at '/'.
  redirect('/chat');
}
