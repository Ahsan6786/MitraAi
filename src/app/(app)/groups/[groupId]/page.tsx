
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}

interface Group {
  name: string;
  members: string[];
}

export default function GroupChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;

    const groupDocRef = doc(db, 'groups', groupId);
    const unsubscribeGroup = onSnapshot(groupDocRef, (doc) => {
      if (doc.exists()) {
        const groupData = doc.data() as Group;
        // Security check: ensure current user is a member
        if (user && !groupData.members.includes(user.uid)) {
          router.push('/groups'); // Redirect if not a member
          return;
        }
        setGroup(groupData);
      } else {
        router.push('/groups'); // Redirect if group doesn't exist
      }
      setIsLoading(false);
    });

    const messagesQuery = query(collection(db, `groups/${groupId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => {
      unsubscribeGroup();
      unsubscribeMessages();
    };
  }, [groupId, user, router]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !group) return;

    try {
      await addDoc(collection(db, `groups/${groupId}/messages`), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
            <Link href="/groups"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-lg md:text-xl font-bold">{group?.name || 'Group Chat'}</h1>
      </header>
      <main className="flex-1 overflow-hidden">
         <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 md:p-6 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={cn('flex items-start gap-3', msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                        {msg.senderId !== user?.uid && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback>{msg.senderName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn("max-w-[70%]", msg.senderId === user?.uid ? 'items-end' : 'items-start')}>
                            {msg.senderId !== user?.uid && <p className="text-xs text-muted-foreground mb-1">{msg.senderName}</p>}
                            <div className={cn('rounded-xl px-4 py-2 text-sm shadow-sm', msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                {msg.text}
                            </div>
                        </div>
                        {msg.senderId === user?.uid && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback>{user.displayName?.[0] || 'Me'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
      </main>
       <footer className="border-t p-2 md:p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
