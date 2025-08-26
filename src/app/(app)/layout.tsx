
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookHeart, MessageSquare, MicVocal, ShieldCheck, LogOut, FileText, Puzzle, Phone, LayoutDashboard, Info, HeartPulse, Sparkles, Trophy, Newspaper, User, Users, Star, Camera, MessageCircleHeart } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { MusicProvider } from '@/hooks/use-music';
import MusicPlayer from '@/components/music-player';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const sidebar = useSidebar();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/signin');
  };

  const handleLinkClick = () => {
    if (sidebar?.isMobile) {
      sidebar.setOpenMobile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userDisplayName = user.displayName || user.email;
  const userAvatarFallback = user.displayName?.[0] || user.email?.[0] || 'U';


  return (
    <>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="size-8 text-primary" />
              <span className="text-lg font-semibold font-headline">MitraAI</span>
            </div>
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {isAdmin ? (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link href="/admin" onClick={handleLinkClick}>
                    <ShieldCheck />
                    <span>Admin Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/chat'}>
                    <Link href="/chat" onClick={handleLinkClick}>
                      <MessageSquare />
                      <span>Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/mood-chat'}>
                    <Link href="/mood-chat" onClick={handleLinkClick}>
                      <MessageCircleHeart />
                      <span>Mood Chat</span>
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
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                    <Link href="/dashboard" onClick={handleLinkClick}>
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/live-mood'}
                  >
                    <Link href="/live-mood" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Camera />
                        <span>Live Mood Analysis</span>
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
                      <Star className="w-4 h-4 text-amber-500" />
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
                    isActive={pathname === '/reports'}
                  >
                    <Link href="/reports" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-2">
                        <FileText />
                        <span>Doctor's Reports</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
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
                  <AvatarFallback>{userAvatarFallback.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{userDisplayName}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                  <Link href="/profile">
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
        <div className="flex flex-col h-full">
          <div className="flex-1">
            {children}
          </div>
          <footer className="p-4 border-t text-center text-xs text-muted-foreground bg-background">
            <strong>A Gentle Reminder:</strong> MitraAI is a supportive friend, not a substitute for professional medical advice, diagnosis, or treatment. Its analysis may not be 100% correct. Always seek the advice of a qualified health provider for any medical questions.
          </footer>
        </div>
        <MusicPlayer />
      </SidebarInset>
    </>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
     <AuthProvider>
        <SidebarProvider>
          <MusicProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
          </MusicProvider>
        </SidebarProvider>
    </AuthProvider>
  );
}
