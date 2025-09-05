
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, getDoc, writeBatch, serverTimestamp, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, UserCheck, UserX, Check, X } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenZToggle } from '@/components/genz-toggle';

interface FriendRequest {
  id: string;
  senderName: string;
}

interface Friend {
  id: string;
  displayName: string;
  email: string;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Listener for incoming friend requests
    const requestsQuery = query(collection(db, 'users', user.uid, 'friendRequests'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
      setRequests(reqs);
    });

    // Listener for friends list
    const friendsQuery = query(collection(db, 'users', user.uid, 'friends'));
    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
      const frs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
      setFriends(frs);
      setIsLoading(false);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
    };
  }, [user]);

  const handleRequest = async (senderId: string, accept: boolean) => {
    if (!user) return;

    const requestRef = doc(db, 'users', user.uid, 'friendRequests', senderId);

    if (accept) {
      try {
        const batch = writeBatch(db);

        // Get sender's data to add to current user's friends list
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        // Get current user's data to add to sender's friends list
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid));

        if (!senderDoc.exists() || !currentUserDoc.exists()) {
            throw new Error("Could not find user profiles.");
        }

        const senderData = senderDoc.data();
        const currentUserData = currentUserDoc.data();

        const senderName = senderData.displayName || senderData.email;
        const currentUserName = currentUserData.displayName || user.email;

        if (!senderName || !currentUserName) {
            throw new Error("User display names are missing.");
        }

        const currentUserFriendRef = doc(db, 'users', user.uid, 'friends', senderId);
        batch.set(currentUserFriendRef, {
            displayName: senderName,
            email: senderData.email,
            addedAt: serverTimestamp(),
        });
        
        // Add current user to sender's friends list
        const senderFriendRef = doc(db, 'users', senderId, 'friends', user.uid);
        batch.set(senderFriendRef, {
            displayName: currentUserName,
            email: user.email,
            addedAt: serverTimestamp(),
        });

        // Delete the request
        batch.delete(requestRef);
        
        await batch.commit();
        toast({ title: 'Friend Added' });

      } catch (error: any) {
        console.error("Error accepting friend request:", error);
        toast({ title: 'Error', description: error.message || 'Could not accept request.', variant: 'destructive' });
      }

    } else {
      // Reject request
      try {
        await deleteDoc(requestRef);
        toast({ title: 'Request Rejected' });
      } catch (error) {
         console.error("Error rejecting friend request:", error);
         toast({ title: 'Error', description: 'Could not reject request.', variant: 'destructive' });
      }
    }
  };
  
  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    
    try {
        const batch = writeBatch(db);
        
        // Remove friend from current user's list
        const currentUserFriendRef = doc(db, 'users', user.uid, 'friends', friendId);
        batch.delete(currentUserFriendRef);
        
        // Remove current user from friend's list
        const friendUserRef = doc(db, 'users', friendId, 'friends', user.uid);
        batch.delete(friendUserRef);
        
        await batch.commit();
        toast({ title: 'Friend Removed' });
        
    } catch(error) {
        console.error("Error removing friend:", error);
        toast({ title: 'Error', description: 'Could not remove friend.', variant: 'destructive' });
    }
  };


  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">Manage Friends</h1>
            <p className="text-sm text-muted-foreground">
              Connect with your community.
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
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
             <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
                    <TabsTrigger value="requests">Friend Requests ({requests.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="friends" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Your Friends</CardTitle>
                            <CardDescription>This is a list of users you are connected with.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {friends.length === 0 ? (
                                <p className="text-muted-foreground">You haven't added any friends yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {friends.map(friend => (
                                        <div key={friend.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{friend.displayName?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{friend.displayName}</p>
                                                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                                                </div>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={() => handleRemoveFriend(friend.id)}>
                                                <UserX className="w-4 h-4 mr-2"/>
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Incoming Requests</CardTitle>
                            <CardDescription>Accept or reject friend requests from other users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {requests.length === 0 ? (
                                <p className="text-muted-foreground">You have no pending friend requests.</p>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <div className="flex items-center gap-3">
                                                 <Avatar>
                                                    <AvatarFallback>{req.senderName?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-semibold">{req.senderName} sent you a request.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleRequest(req.id, true)}>
                                                    <Check className="w-4 h-4 mr-2"/>
                                                    Accept
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, false)}>
                                                    <X className="w-4 h-4 mr-2"/>
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
