
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Edit, Trash2, Check, X } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

// --- Context for Mobile Chat History Sidebar ---
interface ChatHistorySidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const ChatHistorySidebarContext = createContext<ChatHistorySidebarContextType | null>(null);

export function ChatHistorySidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <ChatHistorySidebarContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </ChatHistorySidebarContext.Provider>
    );
}

export function useChatHistorySidebar() {
    const context = useContext(ChatHistorySidebarContext);
    if (!context) {
        throw new Error('useChatHistorySidebar must be used within a ChatHistorySidebarProvider');
    }
    return context;
}
// --- End Context ---


interface Conversation {
    id: string;
    title: string;
}

function SidebarContent({ currentConversationId }: { currentConversationId?: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const chatHistorySidebar = useChatHistorySidebar();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    useEffect(() => {
        if (user) {
            const q = query(collection(db, `users/${user.uid}/conversations`), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
                setConversations(convos);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleNewChat = () => {
        router.push('/chat');
        if (chatHistorySidebar.isOpen) {
            chatHistorySidebar.setIsOpen(false);
        }
    };
    
    const handleLinkClick = () => {
        if (chatHistorySidebar.isOpen) {
            chatHistorySidebar.setIsOpen(false);
        }
    }

    const handleStartRename = (convo: Conversation) => {
        setEditingId(convo.id);
        setRenameValue(convo.title);
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setRenameValue('');
    };

    const handleConfirmRename = async () => {
        if (!editingId || !renameValue.trim() || !user) return;
        const conversationRef = doc(db, `users/${user.uid}/conversations`, editingId);
        await updateDoc(conversationRef, { title: renameValue.trim() });
        toast({ title: 'Chat renamed' });
        handleCancelRename();
    };

    const handleDelete = async (conversationId: string) => {
        if (!user) return;
        try {
            // Delete the conversation document first.
            await deleteDoc(doc(db, `users/${user.uid}/conversations`, conversationId));
            
            toast({ title: "Conversation Deleted" });

            // If the active chat was deleted, navigate to a new chat.
            if (currentConversationId === conversationId) {
                router.push('/chat');
            }

            // In the background, delete all messages in the subcollection.
            const messagesRef = collection(db, `users/${user.uid}/conversations/${conversationId}/messages`);
            const messagesSnapshot = await getDocs(messagesRef);
            
            if (!messagesSnapshot.empty) {
                const batch = writeBatch(db);
                messagesSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }

        } catch (error) {
            console.error("Error deleting conversation: ", error);
            toast({ title: 'Error deleting conversation', description: 'Please try again.', variant: 'destructive' });
        }
    };
    
    return (
        <div className="h-full p-2 flex flex-col">
             <Button onClick={handleNewChat} className="mb-2">
                <Plus className="mr-2 h-4 w-4" />
                New Chat
            </Button>
            <ScrollArea className="flex-1">
                <div className="space-y-1">
                    {conversations.map(convo => (
                        <div key={convo.id} className="group relative rounded-md">
                            {editingId === convo.id ? (
                                <div className="flex items-center gap-1 p-1 w-full">
                                    <Input 
                                        value={renameValue} 
                                        onChange={e => setRenameValue(e.target.value)}
                                        className="h-8"
                                    />
                                    <Button size="icon" className="h-8 w-8" onClick={handleConfirmRename}><Check className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelRename}><X className="w-4 h-4"/></Button>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href={`/chat/${convo.id}`}
                                        className={cn(
                                            "w-full h-full justify-start p-2 flex items-center gap-2 text-sm rounded-md hover:bg-accent",
                                            currentConversationId === convo.id && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={handleLinkClick}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                                        <span className="truncate flex-1">{convo.title}</span>
                                    </Link>
                                    <div className="absolute top-1/2 right-1 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent rounded-md">
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleStartRename(convo)}><Edit className="w-4 h-4"/></Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="w-4 h-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete this chat and all its messages.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(convo.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export function ChatHistorySidebar({ currentConversationId }: { currentConversationId?: string }) {
    const isMobile = useIsMobile();
    const chatHistorySidebar = useChatHistorySidebar();
    
    if (isMobile) {
        return (
            <Sheet open={chatHistorySidebar.isOpen} onOpenChange={chatHistorySidebar.setIsOpen}>
                <SheetContent side="left" className="p-0 w-80">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Your Conversations</SheetTitle>
                    </SheetHeader>
                    <SidebarContent currentConversationId={currentConversationId} />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <div className="h-full w-64 bg-muted/40 flex-col hidden md:flex">
            <SidebarContent currentConversationId={currentConversationId} />
        </div>
    );
}
