
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookHeart, MessageSquare, MicVocal, ShieldCheck, LogOut, FileText, Puzzle, Phone, LayoutDashboard, Info, HeartPulse, Sparkles, Trophy, Newspaper, User, Users, Star, Camera, UserCheck, CalendarPlus, CalendarClock, Menu, LandPlot } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, limit, query, where, doc, getDoc } from 'firebase/firestore';
import StartQuestionnaireModal from '@/components/start-questionnaire-modal';
import { ChatHistoryProvider } from '@/hooks/use-chat-history';
import { GenZToggle } from '@/components/genz-toggle';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const sidebar = useSidebar();
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [userType, setUserType] = useState<'user' | 'admin' | 'counsellor' | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      if (pathname.startsWith('/counsellor')) {
        router.push('/counsellor-signin');
      } else {
        router.push('/signin');
      }
    } else if (!loading && user) {
        const checkUserType = async () => {
            if (user.email === ADMIN_EMAIL) {
                setUserType('admin');
                return;
            }
            const counsellorDoc = await getDoc(doc(db, 'counsellors', user.uid));
            if (counsellorDoc.exists() && counsellorDoc.data().status === 'approved') {
                setUserType('counsellor');
                return;
            }
            setUserType('user');
        };
        checkUserType();
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    const checkQuestionnaire = async () => {
        if (userType === 'user' && !pathname.startsWith('/questionnaire') && !pathname.startsWith('/screening-tools')) {
            const dismissed = sessionStorage.getItem('questionnaireDismissed');
            if (dismissed) return;

            const q = query(
                collection(db, 'questionnaires'),
                where('userId', '==', user.uid),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setShowQuestionnaireModal(true);
            }
        }
    };
    if (user && userType) {
        checkQuestionnaire();
    }
  }, [user, userType, pathname]);
  
  const handleSignOut = async () => {
    await signOut(auth);
    // Redirect to the appropriate sign-in page
    if (pathname.startsWith('/counsellor')) {
        router.push('/counsellor-signin');
    } else {
        router.push('/signin');
    }
  };

  const handleLinkClick = () => {
    if (sidebar?.openMobile) {
      sidebar.setOpenMobile(false);
    }
  };
  
  if (pathname.startsWith('/questionnaire')) {
    return <>{children}</>;
  }


  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading application...</div>
      </div>
    );
  }

  const userDisplayName = user.displayName || user.email;
  const userAvatarFallback = user.displayName?.[0] || user.email?.[0] || 'U';


  return (
    <>
      <StartQuestionnaireModal
        isOpen={showQuestionnaireModal}
        onClose={() => {
            sessionStorage.setItem('questionnaireDismissed', 'true');
            setShowQuestionnaireModal(false);
        }}
        onConfirm={() => {
            setShowQuestionnaireModal(false);
            router.push('/screening-tools');
        }}
      />
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="size-8 text-primary" />
              <span className="text-lg font-semibold font-headline">MitraAI</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {userType === 'admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link href="/admin" onClick={handleLinkClick}>
                    <ShieldCheck />
                    <span>Admin Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {userType === 'counsellor' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/counsellor'}>
                  <Link href="/counsellor" onClick={handleLinkClick}>
                    <UserCheck />
                    <span>Counsellor Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {userType === 'user' && (
              <>
                {/* Highlighted & Reordered Items */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/chat'}>
                    <Link href="/chat" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <MessageSquare />
                        <span>MitraGPT</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/talk'}>
                    <Link href="/talk" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Phone />
                        <span>Talk to Mitra</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/screening-tools'}>
                    <Link href="/screening-tools" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <FileText />
                        <span>Screening Tools</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/culture')}>
                    <Link href="/culture" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <LandPlot />
                        <span>Our Culture</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/community'}>
                    <Link href="/community" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-2">
                        <Users />
                        <span>Community</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/reports'}
                  >
                    <Link href="/reports" onClick={handleLinkClick}>
                      <FileText />
                      <span>Doctor's Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Rest of the items */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                    <Link href="/dashboard" onClick={handleLinkClick}>
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/journal'}>
                    <Link href="/journal" onClick={handleLinkClick}>
                      <BookHeart />
                      <span>Journal</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/live-mood'}>
                    <Link href="/live-mood" onClick={handleLinkClick}>
                      <Camera />
                      <span>Live Mood Analysis</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/booking'}>
                    <Link href="/booking" onClick={handleLinkClick}>
                      <CalendarPlus />
                      <span>Book Appointment</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/my-appointments'}>
                    <Link href="/my-appointments" onClick={handleLinkClick}>
                      <CalendarClock />
                      <span>My Appointments</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/news'}>
                    <Link href="/news" onClick={handleLinkClick}>
                      <Newspaper />
                      <span>AI News</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/affirmations'}>
                    <Link href="/affirmations" onClick={handleLinkClick}>
                      <Sparkles />
                      <span>Affirmations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/games'}
                  >
                    <Link href="/games" onClick={handleLinkClick}>
                      <Puzzle />
                      <span>Mind Games</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/exercises'}
                  >
                    <Link href="/exercises" onClick={handleLinkClick}>
                      <HeartPulse />
                      <span>Mindful Exercises</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/about'}
                  >
                    <Link href="/about" onClick={handleLinkClick}>
                      <Info />
                      <span>About MitraAI</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2 p-2">
             <div className="flex items-center gap-3 p-2">
                <Avatar>
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback>{userAvatarFallback.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{userDisplayName}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                  <Link href="/profile" onClick={handleLinkClick}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full relative">
          <div className="flex-1">
            {children}
          </div>
           {sidebar && (
             <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <Button 
                  onClick={() => sidebar.setOpenMobile(true)}
                  className="rounded-full shadow-lg"
                  size="lg"
                >
                  <Menu className="mr-2 h-5 w-5"/>
                  Explore Features
                </Button>
             </div>
           )}
          <footer className="p-4 border-t text-center text-xs text-muted-foreground bg-background">
            <strong>A Gentle Reminder:</strong> MitraAI is a supportive friend, not a substitute for professional medical advice, diagnosis, or treatment. Its analysis may not be 100% correct. Always seek the advice of a qualified health provider for any medical questions.
          </footer>
        </div>
      </SidebarInset>
    </>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
     <AuthProvider>
        <SidebarProvider>
            <ChatHistoryProvider>
              <AppLayoutContent>{children}</AppLayoutContent>
            </ChatHistoryProvider>
        </SidebarProvider>
    </AuthProvider>
  );
}
