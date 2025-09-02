
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
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
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Trash2, User, ThumbsUp, Plus, Search, Image as ImageIcon, X } from 'lucide-react';
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
  likeCount: number;
  imageUrl?: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
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
      // Delete associated image from storage if it exists
      if (post.imageUrl) {
        const imageRef = ref(storage, post.imageUrl);
        await deleteObject(imageRef);
      }
      
      const commentsQuery = query(collection(db, `posts/${post.id}/comments`));
      const commentsSnapshot = await getDocs(commentsQuery);
      if (!commentsSnapshot.empty) {
        const batch = writeBatch(db);
        commentsSnapshot.forEach(commentDoc => {
          batch.delete(commentDoc.ref);
        });
        await batch.commit();
      }
      
      await deleteDoc(doc(db, 'posts', post.id));

      toast({ title: "Post Deleted", description: "The post and all its contents have been removed." });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Could not delete the post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <Card className="border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <Avatar className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <AvatarFallback className="bg-muted">
                        <User className="text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-foreground text-base font-bold">{post.authorName}</h3>
                    <p className="text-muted-foreground text-sm">
                        Posted {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </p>
                </div>
            </div>
            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting} className="text-muted-foreground hover:text-destructive">
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
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
        {post.imageUrl && (
            <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4 border">
                <Image src={post.imageUrl} alt="Community post image" layout="fill" objectFit="cover" />
            </div>
        )}
        <p className="text-secondary-foreground text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-muted-foreground">
         <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 hover:text-primary">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm font-medium">{post.likeCount || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">{post.commentCount || 0}</span>
            </button>
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
            let commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [postId]);

    const handleDeleteComment = async (commentId: string) => {
        try {
            const postRef = doc(db, 'posts', postId);
            await deleteDoc(doc(db, `posts/${postId}/comments`, commentId));
            await updateDoc(postRef, { commentCount: increment(-1) });
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
            const postRef = doc(db, 'posts', postId);
            const commentCollectionRef = collection(db, `posts/${postId}/comments`);
            
            await addDoc(commentCollectionRef, {
                authorId: user.uid,
                authorName: user.displayName || user.email,
                content: newComment,
                createdAt: serverTimestamp(),
            });

            await updateDoc(postRef, { commentCount: increment(1) });
            
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="px-6 pb-6 pt-2">
            <Separator className="mb-4" />
            <div className="space-y-4">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
                {!isLoading && comments.length === 0 && <p className="text-sm text-muted-foreground text-center">No comments yet. Be the first to comment!</p>}
                {comments.map(comment => {
                    const isCommentAuthor = user?.uid === comment.authorId;
                    const isOwner = user?.email === OWNER_EMAIL;
                    return (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                               <AvatarFallback>{comment.authorName ? comment.authorName[0].toUpperCase() : 'A'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted p-3 rounded-lg">
                               <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-foreground">{comment.authorName}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-muted-foreground mr-1">
                                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                        {(isCommentAuthor || isOwner) && (
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
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
                                <p className="text-sm mt-1 text-secondary-foreground">{comment.content}</p>
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
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPostContent.trim() && !postImage) || !user) return;
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      if (postImage) {
        const imageRef = ref(storage, `community/${user.uid}/${Date.now()}_${postImage.name}`);
        const snapshot = await uploadBytes(imageRef, postImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        content: newPostContent,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
      });
      
      setNewPostContent('');
      removeImage();
      setIsCreatingPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Error", description: "Could not create post.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <header className="border-b bg-background p-3 md:p-4 flex items-center justify-between gap-2">
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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-4">
                <h1 className="text-foreground text-4xl font-bold leading-tight tracking-tight">Community Forum</h1>
                <p className="text-muted-foreground text-lg font-normal leading-normal mt-2">A safe space to share and connect with others.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
                <div className="relative w-full md:w-auto flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input className="pl-10" placeholder="Search for posts..." type="text"/>
                </div>
                <Button className="w-full md:w-auto" onClick={() => setIsCreatingPost(true)}>
                    <Plus className="mr-2 h-4 w-4" />Create Post
                </Button>
            </div>
            
            {isCreatingPost && (
              <Card>
                  <form onSubmit={handleCreatePost}>
                  <CardHeader>
                      <CardTitle className="text-lg">Share with the Community</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                        <Textarea
                            placeholder="What's on your mind?"
                            rows={4}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            disabled={isSubmitting}
                        />
                        {imagePreview && (
                            <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                                <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeImage}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                       <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Add Image
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsCreatingPost(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || (!newPostContent.trim() && !postImage)}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Post
                        </Button>
                      </div>
                  </CardFooter>
                  </form>
              </Card>
            )}

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
