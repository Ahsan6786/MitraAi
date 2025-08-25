
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  runTransaction,
  Timestamp,
  where,
  getDocs,
  writeBatch,
  updateDoc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, ThumbsUp, Send, UserPlus, Bell, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  likeCount: number;
  commentCount: number;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  likeCount: number;
}

interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'declined';
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    setIsLiking(true);

    const postRef = doc(db, 'posts', post.id);
    const likeRef = doc(db, `posts/${post.id}/likes`, user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        if (likeDoc.exists()) {
          transaction.update(postRef, { likeCount: post.likeCount - 1 });
          transaction.delete(likeRef);
        } else {
          transaction.update(postRef, { likeCount: post.likeCount + 1 });
          transaction.set(likeRef, { userId: user.uid });
        }
      });
    } catch (error) {
      console.error("Error liking post:", error);
      toast({ title: "Error", description: "Could not update like.", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddFriend = async () => {
      if (!user || user.uid === post.authorId) return;

      try {
          // Check if a request already exists
          const q = query(collection(db, 'friendRequests'), 
              where('fromUserId', '==', user.uid),
              where('toUserId', '==', post.authorId)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
              toast({ title: "Request already sent", description: "You have already sent a friend request to this user." });
              return;
          }

          await addDoc(collection(db, 'friendRequests'), {
              fromUserId: user.uid,
              fromUserName: user.displayName || user.email,
              toUserId: post.authorId,
              status: 'pending',
              createdAt: serverTimestamp(),
          });
          toast({ title: "Friend Request Sent", description: `Your request to ${post.authorName} has been sent.` });
      } catch (error) {
          console.error("Error sending friend request:", error);
          toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
      }
  };
  
  const authorInitial = post.authorName ? post.authorName[0].toUpperCase() : 'A';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{authorInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{post.authorName}</CardTitle>
            <CardDescription className="text-xs">
              {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
            </CardDescription>
          </div>
          {user && user.uid !== post.authorId && (
              <Button variant="ghost" size="icon" onClick={handleAddFriend} title="Add Friend">
                  <UserPlus className="w-5 h-5"/>
              </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLiking}>
            <ThumbsUp className="w-4 h-4 mr-2" /> {post.likeCount || 0}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="w-4 h-4 mr-2" /> {post.commentCount || 0}
          </Button>
        </div>
      </CardFooter>
      {showComments && <CommentSection postId={post.id} />}
    </Card>
  );
}

function CommentSection({ postId }: { postId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [postId]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);

        try {
            const postRef = doc(db, 'posts', postId);
            
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    throw "Post does not exist!";
                }

                const newCommentCount = (postDoc.data().commentCount || 0) + 1;
                transaction.update(postRef, { commentCount: newCommentCount });
                
                const commentCollectionRef = collection(db, `posts/${postId}/comments`);
                const newCommentRef = doc(commentCollectionRef);
                transaction.set(newCommentRef, {
                    authorId: user.uid,
                    authorName: user.displayName || user.email,
                    content: newComment,
                    createdAt: serverTimestamp(),
                    likeCount: 0,
                });
            });

            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleLikeComment = async (commentId: string) => {
        if (!user) return;
        
        const commentRef = doc(db, `posts/${postId}/comments`, commentId);
        const likeRef = doc(db, `posts/${postId}/comments/${commentId}/likes`, user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const commentDoc = await transaction.get(commentRef);
                const likeDoc = await transaction.get(likeRef);
                
                if (!commentDoc.exists()) throw "Comment does not exist!";
                const currentLikeCount = commentDoc.data().likeCount || 0;

                if (likeDoc.exists()) {
                    transaction.update(commentRef, { likeCount: currentLikeCount - 1 });
                    transaction.delete(likeRef);
                } else {
                    transaction.update(commentRef, { likeCount: currentLikeCount + 1 });
                    transaction.set(likeRef, { userId: user.uid });
                }
            });
        } catch (error) {
            console.error("Error liking comment:", error);
            toast({ title: "Error", description: "Could not update like.", variant: "destructive" });
        }
    }

    return (
        <div className="px-6 pb-6 pt-2">
            <Separator className="mb-4" />
            <div className="space-y-4">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
                {!isLoading && comments.length === 0 && <p className="text-sm text-muted-foreground text-center">No comments yet.</p>}
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                           <AvatarFallback>{comment.authorName ? comment.authorName[0].toUpperCase() : 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted p-3 rounded-lg">
                           <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold">{comment.authorName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                                </p>
                           </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                            <div className="mt-2">
                                <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => handleLikeComment(comment.id)}>
                                    <ThumbsUp className="w-3 h-3 mr-1"/> {comment.likeCount || 0}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-4">
                <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting}
                />
                <Button type="submit" size="icon" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                </Button>
            </form>
        </div>
    );
}

function FriendRequestNotifications() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'friendRequests'),
            where('toUserId', '==', user.uid),
            where('status', '==', 'pending')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setRequests(reqs);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleRequest = async (request: FriendRequest, newStatus: 'accepted' | 'declined') => {
        if (!user) return;
        try {
            const batch = writeBatch(db);
            const reqRef = doc(db, 'friendRequests', request.id);

            if (newStatus === 'accepted') {
                batch.update(reqRef, { status: 'accepted' });
                // Add to friends subcollection for both users
                const user1FriendRef = doc(db, `friends/${user.uid}/userFriends`, request.fromUserId);
                batch.set(user1FriendRef, { friendId: request.fromUserId, since: serverTimestamp() });

                const user2FriendRef = doc(db, `friends/${request.fromUserId}/userFriends`, user.uid);
                batch.set(user2FriendRef, { friendId: user.uid, since: serverTimestamp() });
            } else {
                 batch.update(reqRef, { status: 'declined' });
            }
            await batch.commit();
            toast({ title: `Request ${newStatus}` });
        } catch (error) {
            console.error(`Error handling request:`, error);
            toast({ title: "Error", description: "Could not process the request.", variant: "destructive" });
        }
    };
    
    return (
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {requests.length > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                            {requests.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Friend Requests</h4>
                        <p className="text-sm text-muted-foreground">
                            Accept or decline requests.
                        </p>
                    </div>
                    {isLoading ? <Loader2 className="mx-auto w-5 h-5 animate-spin"/> :
                     requests.length === 0 ? <p className="text-sm text-muted-foreground">No new requests.</p> :
                     <div className="grid gap-2">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between">
                                <span className="text-sm">{req.fromUserName}</span>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRequest(req, 'accepted')}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRequest(req, 'declined')}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    }
                </div>
            </PopoverContent>
        </Popover>
    )
}


export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setIsLoading(false);
      toast({ title: "Error", description: "Could not fetch community posts.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        content: newPostContent,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
      });
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Error", description: "Could not create post.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">Community Feed</h1>
            <p className="text-sm text-muted-foreground">Share your thoughts with the community.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <FriendRequestNotifications />
            <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <form onSubmit={handleCreatePost}>
              <CardHeader>
                <CardTitle className="text-lg">Create a New Post</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="What's on your mind?"
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  disabled={isSubmitting}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Post
                </Button>
              </CardFooter>
            </form>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
                <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
