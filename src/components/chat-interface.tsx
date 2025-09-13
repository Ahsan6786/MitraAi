

'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Languages, Loader2, Send, User, Paperclip, X, Copy, Check, Download, ArrowRight, Bot, MessageSquare } from 'lucide-react';
import { chatEmpatheticTone, ChatEmpatheticToneInput } from '@/ai/flows/chat-empathetic-tone';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { Logo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { SidebarTrigger } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';
import { GenZToggle } from './genz-toggle';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, DocumentData, WithFieldValue, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SOSButton } from './sos-button';
import { useChatHistorySidebar } from './chat-history-sidebar';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const languages = [
    { value: 'English', label: 'English' },
    { value: 'Hinglish', label: 'Hinglish' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Sanskrit', label: 'Sanskrit' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Assamese', label: 'Assamese' },
    { value: 'Bodo', label: 'Bodo' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Konkani', label: 'Konkani' },
    { value: 'Marathi', label: 'Marathi' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Kannada', label: 'Kannada' },
    { value: 'Malayalam', label: 'Malayalam' },
    { value: 'Meitei', label: 'Meitei' },
    { value: 'Mizo', label: 'Mizo' },
    { value: 'Odia', label: 'Odia' },
    { value: 'Punjabi', label: 'Punjabi' },
    { value: 'Nepali', label: 'Nepali' },
    { value: 'Sikkimese', label: 'Sikkimese' },
    { value: 'Lepcha', label: 'Lepcha' },
    { value: 'Limbu', label: 'Limbu' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Kokborok', label: 'Kokborok' },
    { value: 'Bhojpuri', label: 'Bhojpuri' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
];

const CodeBlock = ({ code }: { code: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            toast({ title: "Copied to clipboard!" });
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    return (
        <div className="bg-black/80 rounded-md my-2 relative">
            <pre className="p-4 text-sm text-white overflow-x-auto"><code>{code}</code></pre>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-white hover:bg-white/20 hover:text-white" onClick={handleCopy}>
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
        </div>
    );
};

const SimpleMarkdown = ({ text }: { text: string }) => {
  const router = useRouter();
  const parts = text.split(/(\[.*?\]\(nav:.*?\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const navMatch = part.match(/\[(.*?)\]\(nav:(.*?)\)/);
        if (navMatch) {
          const [, buttonText, path] = navMatch;
          return (
            <div key={`nav-${index}`} className="my-2">
                <Button onClick={() => router.push(path)} variant="secondary" className="h-auto py-2 px-4">
                    <span>{buttonText}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
          );
        }
        const lines = part.split('\n');
        const elements = lines.map((line, lineIndex) => {
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          if (line.trim().startsWith('* ')) {
            return <li key={`li-${index}-${lineIndex}`} dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }} />;
          }
          if (line.trim().match(/^\d+\.\s/)) {
            return <li key={`li-${index}-${lineIndex}`} dangerouslySetInnerHTML={{ __html: line.trim().replace(/^\d+\.\s/, '') }} />;
          }
          if (line.trim() === '') {
            return <br key={`br-${index}-${lineIndex}`} />;
          }
          return <p key={`p-${index}-${lineIndex}`} dangerouslySetInnerHTML={{ __html: line }} />;
        });
        return <div key={`text-${index}`}>{elements}</div>;
      })}
    </>
  );
};

const MessageContent = ({ text }: { text: string }) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            {parts.map((part, index) => {
                const codeMatch = part.match(/^```(\w+)?\n([\s\S]+)```$/);
                if (codeMatch) {
                    return <CodeBlock key={`code-${index}`} code={codeMatch[2]} />;
                }
                return part ? <SimpleMarkdown key={`md-${index}`} text={part} /> : null;
            })}
        </div>
    );
};

const MessageBubble = ({ message, senderName }: { message: Message; senderName: string }) => {
    return (
      <div className="flex flex-col gap-1 items-start w-full">
        <span className="text-muted-foreground text-sm font-medium">{senderName}</span>
        {message.text && (
            <div className={cn('text-base font-normal leading-normal rounded-lg px-4 py-3 max-w-md shadow-sm', message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none')}>
                <MessageContent text={message.text} />
            </div>
        )}
      </div>
    );
};

export default function ChatInterface({ conversationId }: { conversationId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [companionName, setCompanionName] = useState('Mitra');
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const chatHistorySidebar = useChatHistorySidebar();

  const isGenzMode = theme === 'theme-genz-dark';
  
  useEffect(() => {
    if (user) {
        const fetchCompanionName = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().companionName) {
                setCompanionName(docSnap.data().companionName);
            } else {
                setCompanionName('Mitra');
            }
        };
        fetchCompanionName();
    }
  }, [user]);

  useEffect(() => {
    if (user && conversationId) {
        const q = query(collection(db, `users/${user.uid}/conversations/${conversationId}/messages`), orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const history: Message[] = [];
            querySnapshot.forEach((doc) => {
                history.push(doc.data() as Message);
            });
            setMessages(history);
        }, (error) => {
            console.error("Error fetching messages:", error);
            // This finally block is important to stop loading indicator on error
            setIsLoading(false);
        });
        return () => unsubscribe();
    } else {
        setMessages([]); // Clear messages for a new chat
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleSendMessage = async () => {
    if ((!input.trim()) || !user) return;
    
    let currentConvoId = conversationId;
    const messageText = input;

    setInput('');
    
    const userMessageForUI: Message = { 
        sender: 'user', 
        text: messageText,
    };

    setMessages(prev => [...prev, userMessageForUI]);
    setIsLoading(true);

    const historyForFlow: ChatEmpatheticToneInput['history'] = [...messages, userMessageForUI]
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            content: [{ text: msg.text }],
        }))
        .filter(msg => msg.content[0].text);

    if (!currentConvoId) {
        const newConversationRef = doc(collection(db, `users/${user.uid}/conversations`));
        const titleResult = await generateChatTitle({ message: messageText });
        
        await setDoc(newConversationRef, {
            title: titleResult.title,
            createdAt: serverTimestamp(),
        });
        currentConvoId = newConversationRef.id;
        
        const userMessageForDb: Partial<Message> & { sender: 'user', createdAt: any } = { 
            sender: 'user', 
            text: messageText, 
            createdAt: serverTimestamp() 
        };
        await addDoc(collection(db, newConversationRef.path, 'messages'), userMessageForDb);

        router.replace(`/chat/${currentConvoId}`);
    } else {
        const userMessageForDb: Partial<Message> & { sender: 'user', createdAt: any } = { 
            sender: 'user', 
            text: messageText, 
            createdAt: serverTimestamp() 
        };
        const messageColRef = collection(db, `users/${user.uid}/conversations/${currentConvoId}/messages`);
        await addDoc(messageColRef, userMessageForDb);
    }

    try {
      const crisisResult = await detectCrisis({ message: messageText });
      if (crisisResult.isCrisis) {
        setShowCrisisModal(true);
        setIsLoading(false);
        return;
      }

      const chatResult = await chatEmpatheticTone({ 
        message: messageText, 
        language,
        isGenzMode,
        history: historyForFlow,
        companionName,
      });
      
      const aiMessage: Partial<Message> & { sender: 'ai' } = { 
        sender: 'ai', 
        text: chatResult.response 
      };
      
      const messageColRef = collection(db, `users/${user.uid}/conversations/${currentConvoId}/messages`);
      await addDoc(messageColRef, { ...aiMessage, createdAt: serverTimestamp() });

    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      const messageColRef = collection(db, `users/${user.uid}/conversations/${currentConvoId}/messages`);
      await addDoc(messageColRef, { ...errorMessage, createdAt: serverTimestamp() });
      toast({ title: "The AI model is temporarily unavailable. Please try again in a moment.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="w-full h-full flex flex-col z-10">
      <CrisisAlertModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-lg md:text-xl font-bold">{companionName}</h1>
            <p className="text-sm text-muted-foreground">Your Personal AI Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SOSButton />
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isLoading && (
               <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 border shrink-0"><AvatarFallback className="bg-primary text-primary-foreground"><Logo className="w-5 h-5"/></AvatarFallback></Avatar>
                  <MessageBubble message={{sender: 'ai', text: `Hello there! I'm ${companionName}. How are you feeling today?`}} senderName={companionName} />
              </div>
            )}
            {messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.sender === 'ai' && <Avatar className="w-10 h-10 border shrink-0"><AvatarFallback className="bg-primary text-primary-foreground"><Logo className="w-5 h-5"/></AvatarFallback></Avatar>}
                  <div className={cn('flex flex-col gap-1', message.sender === 'user' ? 'items-end' : 'items-start')}>
                     <MessageBubble message={message} senderName={message.sender === 'user' ? (user?.displayName || 'You') : companionName} />
                  </div>
                  {message.sender === 'user' && <Avatar className="w-10 h-10 border shrink-0"><AvatarFallback>{user?.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />}</AvatarFallback></Avatar>}
                </div>
              ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-10 h-10 border shrink-0"><AvatarFallback className="bg-primary text-primary-foreground"><Logo className="w-5 h-5"/></AvatarFallback></Avatar>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-muted-foreground text-sm font-medium">{companionName}</span>
                    <div className="bg-muted text-foreground rounded-lg rounded-tl-none px-4 py-3 flex items-center text-base"><Loader2 className="w-5 h-5 animate-spin mr-2"/> Thinking...</div>
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="shrink-0 bg-background border-t p-2 md:p-3 z-20">
        <form onSubmit={handleFormSubmit} className="relative">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." className="h-12 pr-12 rounded-full" disabled={isLoading} autoComplete="off" />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <Button type="submit" className="ml-2 h-8 px-4" disabled={isLoading || (!input.trim())}><Send className="w-4 h-4"/></Button>
          </div>
        </form>
         <div className="flex items-center justify-between mt-2 px-2">
             <div className="flex items-center space-x-2">
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-auto h-8 text-xs"><Languages className="w-3 h-3 mr-1.5"/><SelectValue placeholder="Language" /></SelectTrigger>
                    <SelectContent>
                        {languages.map(lang => (<SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>))}
                    </SelectContent>
                </Select>
                 <Button 
                    variant="outline"
                    onClick={() => chatHistorySidebar.setIsOpen(true)}
                    className="md:hidden h-8 text-xs"
                >
                    <MessageSquare className="w-3 h-3 mr-1.5"/>
                    Show Chats
                </Button>
            </div>
         </div>
      </footer>
    </div>
  );
}
