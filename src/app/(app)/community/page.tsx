
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
  DocumentData,
  WithFieldValue,
  setDoc,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Trash2, User, ThumbsUp, Plus, Search, Image as ImageIcon, X, UserPlus, MoreVertical, Bookmark, Users as UsersIcon } from 'lucide-react';
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
import { GenZToggle } from '@/components/genz-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { SOSButton } from '@/components/sos-button';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  commentCount: number;
  likeCount: number;
  imageUrl?: string;
  likedBy?: string[];
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
  const [friendStatus, setFriendStatus] = useState<'not_friends' | 'pending' | 'friends' | 'self'>('not_friends');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  
  const isAuthor = user && user.uid === post.authorId;
  const isOwner = user?.email === OWNER_EMAIL;
  const canDelete = isAuthor || isOwner;

  useEffect(() => {
    if (user && post.likedBy?.includes(user.uid)) {
      setIsLiked(true);
    }
  }, [user, post.likedBy]);

  useEffect(() => {
    if (!user || !post.authorId) return;
    if (user.uid === post.authorId) {
      setFriendStatus('self');
      return;
    }

    const checkStatus = async () => {
      const friendDoc = await getDoc(doc(db, 'users', user.uid, 'friends', post.authorId));
      if (friendDoc.exists()) {
        setFriendStatus('friends');
        return;
      }
      const sentRequestDoc = await getDoc(doc(db, 'users', post.authorId, 'friendRequests', user.uid));
      if (sentRequestDoc.exists()) {
        setFriendStatus('pending');
        return;
      }
    };
    checkStatus();
  }, [user, post.authorId]);


  const handleDeletePost = async () => {
    if (!canDelete) return; 
    setIsDeleting(true);
    try {
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

      toast({ title: "Post Deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Could not delete the post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || isAuthor) return;

    try {
      const requestRef = doc(db, 'users', post.authorId, 'friendRequests', user.uid);
      await setDoc(requestRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setFriendStatus('pending');
      toast({ title: "Friend Request Sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    }
  };
  
  const handleLikePost = async () => {
    if (!user) {
      toast({ title: "Please log in to like posts.", variant: "destructive" });
      return;
    }
    const postRef = doc(db, 'posts', post.id);
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw "Document does not exist!";
      }
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      const newLikeCount = postData.likeCount || 0;

      if (likedBy.includes(user.uid)) {
        // Unlike
        transaction.update(postRef, {
          likeCount: increment(-1),
          likedBy: likedBy.filter((id: string) => id !== user.uid)
        });
        setIsLiked(false);
        setLikeCount(newLikeCount - 1);
      } else {
        // Like
        transaction.update(postRef, {
          likeCount: increment(1),
          likedBy: [...likedBy, user.uid]
        });
        setIsLiked(true);
        setLikeCount(newLikeCount + 1);
      }
    });
  };


  return (
    <div className="bg-[#1a2836] p-5 rounded-lg">
        <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-white font-bold">{post.authorName}</p>
                    <p className="text-gray-400 text-sm">
                        {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#233648]">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d131a] border-[#233648] text-white">
                    {friendStatus !== 'self' && (
                        <DropdownMenuItem onSelect={handleAddFriend} disabled={friendStatus !== 'not_friends'}>
                           <UserPlus className="w-4 h-4 mr-2" />
                           {friendStatus === 'not_friends' ? 'Add Friend' : (friendStatus === 'pending' ? 'Request Sent' : 'Friends')}
                        </DropdownMenuItem>
                    )}
                    {canDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Post
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this post and all of its comments.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeletePost}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
            <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg mb-4" style={{ backgroundImage: `url("${post.imageUrl}")` }}>
            </div>
        )}
        <div className="flex justify-between text-gray-400">
            <div className="flex items-center gap-4">
                <button 
                  onClick={handleLikePost}
                  className={cn(
                    "flex items-center gap-1 hover:text-primary transition-colors",
                    isLiked && "text-primary"
                  )}>
                  <ThumbsUp className={cn("text-xl", isLiked && "fill-current")}/> {likeCount}
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => setShowComments(!showComments)}><MessageSquare className="text-xl"/> {post.commentCount || 0}</button>
            </div>
            <button className="hover:text-primary transition-colors"><Bookmark className="text-xl"/></button>
        </div>
        {showComments && <CommentSection postId={post.id} />}
    </div>
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
        <div className="pt-4 mt-4 border-t border-gray-700">
            <div className="space-y-4">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />}
                {!isLoading && comments.length === 0 && <p className="text-sm text-gray-500 text-center">No comments yet.</p>}
                {comments.map(comment => {
                    const isCommentAuthor = user?.uid === comment.authorId;
                    const isOwner = user?.email === OWNER_EMAIL;
                    return (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                               <AvatarFallback>{comment.authorName ? comment.authorName[0].toUpperCase() : 'A'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-[#233648] p-3 rounded-lg">
                               <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-white">{comment.authorName}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-gray-400 mr-1">
                                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                        {(isCommentAuthor || isOwner) && (
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500">
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
                                <p className="text-sm mt-1 text-gray-300">{comment.content}</p>
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
                    className="bg-[#233648] text-white placeholder-gray-400 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                </Button>
            </form>
        </div>
    );
}

interface PostData {
    authorId: string;
    authorName: string | null;
    content: string;
    createdAt: any;
    commentCount: number;
    likeCount: number;
    likedBy: string[];
    imageUrl?: string;
}

function CommunityPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
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
  
  useEffect(() => {
    if (user) {
      const requestsQuery = query(collection(db, 'users', user.uid, 'friendRequests'));
      const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        setFriendRequestCount(snapshot.size);
      });
      return () => unsubscribeRequests();
    }
  }, [user]);

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
  
      const postData: PostData = {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        content: newPostContent,
        createdAt: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
        likedBy: [],
      };
  
      if (imageUrl) {
        postData.imageUrl = imageUrl;
      }
  
      await addDoc(collection(db, 'posts'), postData);
      
      setNewPostContent('');
      removeImage();
      setIsCreatePostOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Error", description: "Could not create post.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#111a22]">
      <header className="border-b border-[#233648] bg-[#0d131a] p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden text-white" />
          <div className="relative w-full md:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input className="pl-10 bg-[#233648] text-white border-none focus:ring-2 focus:ring-primary placeholder:text-gray-400" placeholder="Search..." type="text"/>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="relative text-white hover:bg-[#233648] hover:text-white px-3 h-9">
                <Link href="/friends" className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    <span className="text-sm font-medium">My Friends</span>
                    {friendRequestCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                          {friendRequestCount}
                        </Badge>
                    )}
                </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-[#233648] hover:text-white px-3 h-9">
                <Link href="/groups" className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Groups</span>
                </Link>
            </Button>
            <SOSButton />
            <GenZToggle />
            <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-white text-3xl font-bold">Community Feed</h1>
                <Button onClick={() => setIsCreatePostOpen(!isCreatePostOpen)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Post
                </Button>
            </div>
            
            {isCreatePostOpen && (
              <form onSubmit={handleCreatePost} className="bg-[#1a2836] p-4 rounded-lg mb-6 animate-in fade-in-50">
                  <div className="flex items-start gap-4">
                      <Avatar className="w-11 h-11 mt-1">
                          <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                          <Textarea 
                            className="w-full bg-[#233648] text-white placeholder-gray-400 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary resize-none" 
                            placeholder="What's on your mind?" 
                            rows={3}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            disabled={isSubmitting}
                          />
                          {imagePreview && (
                              <div className="relative w-32 h-32 mt-2 rounded-md overflow-hidden border border-[#233648]">
                                  <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeImage}>
                                      <X className="w-4 h-4" />
                                  </Button>
                              </div>
                          )}
                          <div className="flex justify-between items-center mt-3">
                              <div className="flex gap-2 text-gray-400">
                                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                  <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:text-primary transition-colors"><ImageIcon/></button>
                              </div>
                              <Button type="submit" disabled={isSubmitting || (!newPostContent.trim() && !postImage)}>
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Post
                              </Button>
                          </div>
                      </div>
                  </div>
              </form>
            )}


            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    <p>No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default function CommunityPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenCommunityIntro';

    useEffect(() => {
        setIsClient(true);
        const hasSeen = sessionStorage.getItem(SESSION_KEY);
        if (hasSeen) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <SectionIntroAnimation 
            onFinish={handleIntroFinish} 
            icon={<UsersIcon className="w-full h-full" />}
            title="Community"
            subtitle="Connect, share, and grow together."
        />;
    }

    return <CommunityPageContent />;
}
