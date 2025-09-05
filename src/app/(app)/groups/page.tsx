
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, getDoc, query, where } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Users, Loader2, UserPlus, Search } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Friend {
  id: string;
  displayName: string;
  email: string;
}

interface Group {
    id: string;
    name: string;
    memberCount: number;
}

function CreateGroupDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    const friendsQuery = query(collection(db, 'users', user.uid, 'friends'));
    const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
      const friendsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
      setFriends(friendsData);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const handleNextStep = () => {
    if (groupName.trim()) {
      setStep(2);
    }
  };

  const handleFriendSelect = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };
  
  const resetState = () => {
      setGroupName('');
      setSelectedFriends([]);
      setStep(1);
      setIsOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedFriends.length === 0) {
        toast({ title: 'Please provide a group name and select at least one friend.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    
    try {
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
        const members = [user.uid, ...selectedFriends];
        const memberInfo: Record<string, { displayName: string }> = {};

        // Add current user to member info
        memberInfo[user.uid] = { displayName: currentUserDoc.data()?.displayName || user.email || 'Unknown User' };

        // Add selected friends to member info
        for (const friendId of selectedFriends) {
            const friend = friends.find(f => f.id === friendId);
            if (friend) {
                memberInfo[friendId] = { displayName: friend.displayName };
            }
        }

        await addDoc(collection(db, 'groups'), {
            name: groupName,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            members: members,
            memberInfo: memberInfo,
        });

        toast({ title: 'Group Created!', description: `You can now start chatting in "${groupName}".`});
        resetState();

    } catch (error) {
        console.error("Error creating group:", error);
        toast({ title: 'Failed to create group', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Give your group a name to get started.' : 'Select friends to add to your group.'}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="py-4">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g., Study Buddies"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        ) : (
          <div className="py-4">
             <ScrollArea className="h-64">
                <div className="space-y-4 pr-4">
                    {friends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{friend.displayName?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{friend.displayName}</p>
                                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                                </div>
                            </div>
                            <Checkbox
                                checked={selectedFriends.includes(friend.id)}
                                onCheckedChange={() => handleFriendSelect(friend.id)}
                                id={`friend-${friend.id}`}
                            />
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </div>
        )}
        <DialogFooter>
          {step === 1 ? (
            <Button onClick={handleNextStep} disabled={!groupName.trim()}>
              Next
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleCreateGroup} disabled={isLoading || selectedFriends.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Group
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const { user } = useAuth();

  useEffect(() => {
      if (!user) return;
      
      const groupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      
      const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
          const groupsData = snapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
              memberCount: doc.data().members.length,
          } as Group));
          setGroups(groupsData);
      });
      
      return () => unsubscribe();
  }, [user]);

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Group Chats
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect and chat with your friends.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Groups</h2>
            <CreateGroupDialog />
          </div>

          {groups.length === 0 ? (
            <Card className="text-center p-6 md:p-10 border-dashed">
              <CardHeader>
                <CardTitle>No Groups Yet</CardTitle>
                <CardDescription>
                  You haven't joined or created any groups. Create one to start chatting with friends!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
             <div className="grid gap-4 md:grid-cols-2">
              {groups.map(group => (
                  <Link href={`/groups/${group.id}`} key={group.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription>{group.memberCount} members</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
