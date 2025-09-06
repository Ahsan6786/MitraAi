
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, Timestamp, updateDoc, arrayUnion, arrayRemove, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send, User, Users, MoreVertical, X, UserPlus, LogOut, Check, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';

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
  admins?: string[]; // Make admins optional to handle old data
  createdBy: string;
}

interface Member {
  id: string;
  displayName: string;
}

interface Friend {
  id: string;
  displayName: string;
}

function GroupInfoDialog({ group, groupId }: { group: Group, groupId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(group.name);
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const groupAdmins = group.admins || []; // Safely default to an empty array
    const isSuperAdmin = user?.uid === group.createdBy;
    const isAdmin = groupAdmins.includes(user?.uid || '');

    useEffect(() => {
        const fetchMembers = async () => {
            if (group.members.length > 0) {
                const memberPromises = group.members.map(id => getDoc(doc(db, 'users', id)));
                const memberDocs = await Promise.all(memberPromises);
                const memberData = memberDocs
                    .filter(doc => doc.exists())
                    .map(doc => ({ id: doc.id, displayName: doc.data()?.displayName || doc.data()?.email || 'Unknown' }));
                setMembers(memberData);
            }
        };
        fetchMembers();
    }, [group.members]);
    
    useEffect(() => {
        if (!user || !isAddMembersOpen) return;
        const fetchFriends = async () => {
            const friendsQuery = query(collection(db, `users/${user.uid}/friends`));
            const querySnapshot = await getDocs(friendsQuery);
            const friendsData = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Friend))
                .filter(friend => !group.members.includes(friend.id)); // Only show friends not already in the group
            setFriends(friendsData);
        };
        fetchFriends();
    }, [user, isAddMembersOpen, group.members]);


    const handleRenameGroup = async () => {
        if (!newName.trim() || newName === group.name) {
            setIsEditingName(false);
            return;
        }
        await updateDoc(doc(db, 'groups', groupId), { name: newName });
        toast({ title: "Group renamed successfully!" });
        setIsEditingName(false);
    };

    const handleAddMembers = async () => {
        if (selectedFriends.length === 0) return;
        setIsLoading(true);
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
            members: arrayUnion(...selectedFriends)
        });
        toast({ title: "Members added!" });
        setSelectedFriends([]);
        setIsAddMembersOpen(false);
        setIsLoading(false);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!isAdmin) return;
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
            members: arrayRemove(memberId),
            admins: arrayRemove(memberId) // Also remove from admins if they are one
        });
        toast({ title: "Member removed." });
    };

    const handleLeaveGroup = async () => {
        if (!user) return;
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
            members: arrayRemove(user.uid),
            admins: arrayRemove(user.uid)
        });
        toast({ title: "You have left the group." });
        router.push('/groups');
    };

    const handleToggleAdmin = async (memberId: string) => {
        if (!isSuperAdmin) return;
        const groupRef = doc(db, 'groups', groupId);
        if (groupAdmins.includes(memberId)) {
            await updateDoc(groupRef, { admins: arrayRemove(memberId) });
            toast({ title: "Admin status removed." });
        } else {
            await updateDoc(groupRef, { admins: arrayUnion(memberId) });
            toast({ title: "Promoted to admin." });
        }
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                {isEditingName && isAdmin ? (
                    <div className="flex items-center gap-2">
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="text-lg font-semibold" />
                        <Button size="icon" onClick={handleRenameGroup}><Check className="w-4 h-4" /></Button>
                    </div>
                ) : (
                    <DialogTitle className="flex items-center gap-2">
                        {group.name}
                        {isAdmin && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingName(true)}><Edit className="w-4 h-4" /></Button>}
                    </DialogTitle>
                )}
                <DialogDescription>{group.members.length} members</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <h3 className="font-semibold mb-2">Members</h3>
                <ScrollArea className="h-64">
                    <div className="space-y-3 pr-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8"><AvatarFallback>{member.displayName[0]}</AvatarFallback></Avatar>
                                    <span>{member.displayName}</span>
                                    {groupAdmins.includes(member.id) && <Badge variant="secondary">Admin</Badge>}
                                </div>
                                {isAdmin && user?.uid !== member.id && (
                                     <Dialog>
                                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4"/></Button></DialogTrigger>
                                        <DialogContent className="sm:max-w-xs">
                                            <div className="py-2 flex flex-col gap-1">
                                                {isSuperAdmin && member.id !== group.createdBy && <Button variant="ghost" className="w-full justify-start" onClick={() => handleToggleAdmin(member.id)}>{groupAdmins.includes(member.id) ? "Dismiss as admin" : "Make admin"}</Button>}
                                                <Button variant="destructive" className="w-full justify-start" onClick={() => handleRemoveMember(member.id)}>Remove {member.displayName}</Button>
                                            </div>
                                        </DialogContent>
                                     </Dialog>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter className="flex-col gap-2">
                <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
                    <DialogTrigger asChild><Button className="w-full"><UserPlus className="w-4 h-4 mr-2" />Add Members</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Friends to Group</DialogTitle></DialogHeader>
                        <ScrollArea className="h-64 mt-4">
                             <div className="space-y-4 pr-4">
                                {friends.length === 0 && <p className="text-muted-foreground text-sm text-center">All your friends are already in this group.</p>}
                                {friends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between">
                                        <Label htmlFor={`friend-${friend.id}`} className="flex items-center gap-3 font-normal cursor-pointer">
                                            <Avatar><AvatarFallback>{friend.displayName[0]}</AvatarFallback></Avatar>
                                            <span>{friend.displayName}</span>
                                        </Label>
                                        <Checkbox id={`friend-${friend.id}`} checked={selectedFriends.includes(friend.id)} onCheckedChange={() => setSelectedFriends(p => p.includes(friend.id) ? p.filter(id => id !== friend.id) : [...p, friend.id])} />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                             <Button variant="outline" onClick={() => setIsAddMembersOpen(false)}>Cancel</Button>
                             <Button onClick={handleAddMembers} disabled={isLoading || selectedFriends.length === 0}>{isLoading ? <Loader2 className="animate-spin mr-2"/> : null} Add to Group</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {!isAdmin && <Button variant="destructive" className="w-full" onClick={handleLeaveGroup}><LogOut className="w-4 h-4 mr-2"/>Leave Group</Button>}
            </DialogFooter>
        </DialogContent>
    )
}

export default function GroupChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { toast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId || !user) return;

    const groupDocRef = doc(db, 'groups', groupId);
    const unsubscribeGroup = onSnapshot(groupDocRef, (doc) => {
      if (doc.exists()) {
        const groupData = doc.data() as Group;
        if (!groupData.members.includes(user.uid)) {
          router.push('/groups');
          return;
        }
        setGroup(groupData);
      } else {
        router.push('/groups');
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
      const senderDoc = await getDoc(doc(db, 'users', user.uid));
      const senderName = senderDoc.data()?.displayName || user.email;

      await addDoc(collection(db, `groups/${groupId}/messages`), {
        text: newMessage,
        senderId: user.uid,
        senderName: senderName,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
        await deleteDoc(doc(db, `groups/${groupId}/messages`, messageId));
        toast({ title: "Message Deleted" });
    } catch (error) {
        console.error("Error deleting message:", error);
        toast({ title: "Error", description: "Could not delete message.", variant: "destructive" });
    }
  };
  
  if (isLoading || !group) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
                <Link href="/groups"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-lg md:text-xl font-bold">{group?.name || 'Group Chat'}</h1>
        </div>
        <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon"><Users /></Button>
            </DialogTrigger>
            <GroupInfoDialog group={group} groupId={groupId} />
        </Dialog>
      </header>
      <main className="flex-1 overflow-hidden">
         <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 md:p-6 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={cn('group flex items-start gap-3', msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                        {msg.senderId === user?.uid && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your message. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {msg.senderId !== user?.uid && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback>{msg.senderName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn("flex flex-col max-w-[70%]", msg.senderId === user?.uid ? 'items-end' : 'items-start')}>
                           {msg.senderId !== user?.uid && <p className="text-xs text-muted-foreground mb-1">{msg.senderName}</p>}
                            <div className={cn('rounded-xl px-4 py-2 text-sm shadow-sm', msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                {msg.text}
                            </div>
                             <p className="text-xs text-muted-foreground mt-1">
                                {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
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
