'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';

function CounsellorSignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user is a counsellor and is approved
      const counsellorDoc = await getDoc(doc(db, 'counsellors', user.uid));
      if (counsellorDoc.exists()) {
        const counsellorData = counsellorDoc.data();
        if (counsellorData.status === 'approved') {
          router.push('/counsellor');
        } else if (counsellorData.status === 'pending') {
           toast({
            title: "Account Pending",
            description: "Your account is awaiting admin approval.",
            variant: "default",
          });
          await auth.signOut(); // Sign out the user
        } else {
           toast({
            title: "Access Denied",
            description: "Your account has not been approved.",
            variant: "destructive",
          });
          await auth.signOut();
        }
      } else {
        toast({
          title: "Not a Counsellor Account",
          description: "This email is not registered as a counsellor.",
          variant: "destructive",
        });
        await auth.signOut();
      }
    } catch (error: any) {
       toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
        <form onSubmit={handleSignIn}>
          <CardHeader className="text-center">
             <div className="flex justify-center mb-4">
               <Logo className="w-10 h-10 text-primary" />
             </div>
            <CardTitle className="text-2xl">Counsellor Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the counsellor panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
               <div className="flex items-center">
                 <Label htmlFor="password">Password</Label>
               </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have a counsellor account?{' '}
              <Link href="/counsellor-signup" className="underline">
                Sign up
              </Link>
            </div>
             <div className="text-center text-sm">
              Not a counsellor?{' '}
              <Link href="/signin" className="underline">
                Sign in as a user
              </Link>
            </div>
          </CardFooter>
        </form>
    </Card>
  );
}

export default function CounsellorSignInPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient ? <CounsellorSignInForm /> : null;
}
