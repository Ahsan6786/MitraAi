
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
  deleteDoc,
  Timestamp,
  getDocs,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  commentCount: number;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  hidden?: boolean;
}

const OWNER_EMAIL = 'ahsanimamkhan06@gmail.com';

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const authorInitial = post.authorName ? post.authorName[0].toUpperCase() : 'A';
  const isAuthor = user && user.uid === post.authorId;
  const isOwner = user?.email === OWNER_EMAIL;
  const canDelete = isAuthor || isOwner;

  const handleDeletePost = async () => {
    if (!canDelete) return; 
    setIsDeleting(true);
    try {
      // First, delete all comments in the subcollection
      const commentsQuery = query(collection(db, `posts/${post.id}/comments`));
      const commentsSnapshot = await getDocs(commentsQuery);
      if (!commentsSnapshot.empty) {
        const batch = writeBatch(db);
        commentsSnapshot.forEach(commentDoc => {
          batch.delete(commentDoc.ref);
        });
        await batch.commit();
      }
      
      // Then, delete the post itself
      await deleteDoc(doc(db, 'posts', post.id));

      toast({ title: "Post Deleted", description: "The post and all its comments have been removed." });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Could not delete the post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


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
          {canDelete && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this post and all of its comments.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePost}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm sm:text-base">{post.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
         <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="w-4 h-4 mr-2" /> {post.commentCount || 0} Comments
          </Button>
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
    const isOwner = user?.email === OWNER_EMAIL;

    useEffect(() => {
        const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            // Filter hidden comments for non-owners
            if (!isOwner) {
                commentsData = commentsData.filter(comment => !comment.hidden);
            }
            setComments(commentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [postId, isOwner]);

    const handleToggleHideComment = async (comment: Comment) => {
        if (!isOwner) return;
        try {
            const commentRef = doc(db, `posts/${postId}/comments`, comment.id);
            await updateDoc(commentRef, {
                hidden: !comment.hidden,
            });
            toast({ title: `Comment ${comment.hidden ? 'unhidden' : 'hidden'}.` });
        } catch (error) {
            console.error('Error hiding comment:', error);
            toast({ title: 'Error', description: 'Could not update comment visibility.', variant: 'destructive' });
        }
    };
    
    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteDoc(doc(db, `posts/${postId}/comments`, commentId));
            toast({ title: 'Comment Deleted' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast({ title: 'Error', description: 'Could not delete comment.', variant: 'destructive' });
        }
    };


    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);

        try {
            const commentCollectionRef = collection(db, `posts/${postId}/comments`);
            await addDoc(commentCollectionRef, {
                authorId: user.uid,
                authorName: user.displayName || user.email,
                content: newComment,
                createdAt: serverTimestamp(),
                hidden: false,
            });
            
            // The comment count will be updated by the Cloud Function.
            // We no longer update it from the client.
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 pb-6 pt-2">
            <Separator className="mb-4" />
            <div className="space-y-4">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
                {!isLoading && comments.length === 0 && <p className="text-sm text-muted-foreground text-center">No comments yet. Be the first to comment!</p>}
                {comments.map(comment => {
                    const isCommentAuthor = user?.uid === comment.authorId;
                    return (
                        <div key={comment.id} className={cn("flex items-start gap-3 transition-opacity", comment.hidden && 'opacity-50')}>
                            <Avatar className="w-8 h-8">
                               <AvatarFallback>{comment.authorName ? comment.authorName[0].toUpperCase() : 'A'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted p-3 rounded-lg">
                               <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold">{comment.authorName}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-muted-foreground mr-1">
                                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                        {isOwner && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleHideComment(comment)}>
                                                {comment.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </Button>
                                        )}
                                        {isCommentAuthor && (
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete this comment? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                               </div>
                                <p className="text-sm mt-1">{comment.hidden && !isOwner ? <i>Comment hidden by moderator</i> : comment.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-4">
                <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting}
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                </Button>
            </form>
        </div>
    );
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
            <p className="text-sm text-muted-foreground">Share your thoughts and connect.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <form onSubmit={handleCreatePost}>
                <CardHeader>
                    <CardTitle className="text-lg">Share with the Community</CardTitle>
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
                    <Button type="submit" disabled={isSubmitting || !newPostContent.trim()}>
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

    