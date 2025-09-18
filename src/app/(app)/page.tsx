
import { redirect } from 'next/navigation';

export default function AppPage() {
  // Redirect authenticated users from the root of the authenticated zone ('/')
  // to the main landing page. The public landing page is at '/'.
  redirect('/');
}
