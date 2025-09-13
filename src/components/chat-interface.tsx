
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Languages, Loader2, Mic, Send, User, Square, Paperclip, X, Copy, Check, Download, ArrowRight } from 'lucide-react';
import { chatEmpatheticTone, ChatEmpatheticToneInput } from '@/ai/flows/chat-empathetic-tone';
import { Logo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { detectCrisis } from '@/ai/flows/detect-crisis';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { type Message } from '@/hooks/use-chat-history';
import { SidebarTrigger } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';
import { GenZToggle } from './genz-toggle';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, DocumentData, WithFieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

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

// Component to render code blocks with a copy button
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
            <pre className="p-4 text-sm text-white overflow-x-auto">
                <code>{code}</code>
            </pre>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                onClick={handleCopy}
            >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
        </div>
    );
};

// Simple Markdown parser component
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
                <Button
                    onClick={() => router.push(path)}
                    variant="secondary"
                    className="h-auto py-2 px-4"
                >
                    <span>{buttonText}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
          );
        }
        
        // Render regular text, lists, etc.
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


// Component to parse and render message content (text and code)
const MessageContent = ({ text }: { text: string }) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            {parts.map((part, index) => {
                const codeMatch = part.match(/^```(\w+)?\n([\s\S]+)```$/);
                if (codeMatch) {
                    return <CodeBlock key={`code-${index}`} code={codeMatch[2]} />;
                }
                // Don't render empty strings which can result from split
                return part ? <SimpleMarkdown key={`md-${index}`} text={part} /> : null;
            })}
        </div>
    );
};

// Component for a single message bubble with a copy button
const MessageBubble = ({ message, senderName }: { message: Message; senderName: string }) => {

    return (
      <div className="flex flex-col gap-1 items-start w-full">
        <span className="text-muted-foreground text-sm font-medium">{senderName}</span>

        {message.imageUrl && (
            <div className="relative w-full max-w-sm aspect-auto rounded-md overflow-hidden group/image mb-2">
                <Image src={message.imageUrl} alt="Image in chat" width={400} height={400} className="object-cover h-auto w-full" />
                    <a
                    href={message.imageUrl}
                    download="mitra-ai-generated-image.png"
                    className="absolute bottom-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity"
                >
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                        <Download className="h-4 h-4" />
                        <span className="sr-only">Download Image</span>
                    </Button>
                </a>
            </div>
        )}
        
        {message.text && (
            <div
                className={cn(
                    'text-base font-normal leading-normal rounded-lg px-4 py-3 max-w-md shadow-sm',
                    message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted text-foreground rounded-tl-none'
                )}
            >
                <MessageContent text={message.text} />
            </div>
        )}
      </div>
    );
};


export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isRecording, setIsRecording] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [companionName, setCompanionName] = useState('Mitra');
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { user } = useAuth(); // Can be null if not logged in
  const { theme } = useTheme();

  const isGenzMode = theme === 'theme-genz-dark';
  
  useEffect(() => {
    if (user) {
        // Fetch companion name
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
        
        // Listen for chat history
        const q = query(collection(db, `users/${user.uid}/chatHistory`), orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const history: Message[] = [];
            querySnapshot.forEach((doc) => {
                history.push(doc.data() as Message);
            });
            setMessages(history);
        });
        
        return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const saveMessageToDb = async (message: Message) => {
      if (!user) return;
      
      const messageData: WithFieldValue<DocumentData> = {
          ...message,
          createdAt: serverTimestamp(),
      };
      
      // Firestore does not allow `undefined` fields.
      // Remove imageUrl if it's not a valid string.
      if (!messageData.imageUrl) {
          delete messageData.imageUrl;
      }
      
      await addDoc(collection(db, `users/${user.uid}/chatHistory`), messageData);
  };

  const handleSendMessage = async (messageText: string) => {
    if ((!messageText.trim() && !imageFile) || isLoading || !user) return;

    let imageDataUri: string | undefined;
    
    if (imageFile) {
        imageDataUri = await fileToDataUri(imageFile);
    }
    
    const userMessage: Message = { sender: 'user', text: messageText, imageUrl: imageDataUri };
    await saveMessageToDb(userMessage);

    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      // First, check for crisis
      try {
        const crisisResult = await detectCrisis({ message: messageText });
        if (crisisResult.isCrisis) {
          setShowCrisisModal(true);
          setIsLoading(false);
          // Note: We're not deleting the crisis message from DB, it's part of the history.
          return;
        }
      } catch (crisisError) {
        console.error("Crisis detection service failed:", crisisError);
        setShowCrisisModal(true);
        setIsLoading(false);
        return;
      }

      // Convert message history to the format expected by the flow
      const history: ChatEmpatheticToneInput['history'] = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: [{ text: msg.text }],
      }));

      const chatResult = await chatEmpatheticTone({ 
        message: messageText, 
        language,
        isGenzMode,
        imageDataUri,
        history,
        companionName,
      });
      
      const aiMessage: Message = { sender: 'ai', text: chatResult.response, imageUrl: chatResult.imageUrl };
      await saveMessageToDb(aiMessage);

      if (isRecording) {
        if (chatResult.response.trim()) {
            const ttsResult = await textToSpeech({ text: chatResult.response });
            if (ttsResult.audioDataUri) {
                const audio = new Audio(ttsResult.audioDataUri);
                audioRef.current = audio;
                audio.play();
            }
        }
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      await saveMessageToDb(errorMessage);
    } finally {
      setIsLoading(false);
      if (recognitionRef.current) {
        setIsRecording(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  const handleVoiceButtonClick = () => {
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Speech API for voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
       recognitionRef.current?.stop();
       setIsRecording(false);
    } else {
        setIsRecording(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleSendMessage(transcript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            toast({
                title: "Voice Error",
                description: "There was an error with voice recognition. Please try again.",
                variant: "destructive",
            });
            setIsRecording(false);
        };
        
         recognitionRef.current.onend = () => {
            if (recognitionRef.current) {
               setIsRecording(false);
            }
        };

        recognitionRef.current.start();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col z-10">
      <CrisisAlertModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />
      <header className="border-b p-3 md:p-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-lg md:text-xl font-bold">{companionName}</h1>
            <p className="text-sm text-muted-foreground">Your Personal AI Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.length === 0 && (
               <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 border shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Logo className="w-5 h-5"/>
                    </AvatarFallback>
                  </Avatar>
                  <MessageBubble message={{sender: 'ai', text: `Hello there! I'm ${companionName}. How are you feeling today? I'm here to listen and support you in any way I can. Feel free to share your thoughts and feelings with me.`}} senderName={companionName} />
              </div>
            )}
            {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="w-10 h-10 border shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Logo className="w-5 h-5"/>
                      </AvatarFallback>
                    </Avatar>
                  )}
                   <div className={cn('flex flex-col gap-1', message.sender === 'user' ? 'items-end' : 'items-start')}>
                     <MessageBubble 
                        message={message} 
                        senderName={message.sender === 'user' ? (user?.displayName || 'You') : companionName}
                     />
                   </div>
                  {message.sender === 'user' && (
                    <Avatar className="w-10 h-10 border shrink-0">
                      <AvatarFallback>
                        {user?.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            }
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-10 h-10 border shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Logo className="w-5 h-5"/>
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-muted-foreground text-sm font-medium">{companionName}</span>
                        <div className="bg-muted text-foreground rounded-lg rounded-tl-none px-4 py-3 flex items-center text-base">
                          <Loader2 className="w-5 h-5 animate-spin mr-2"/> Thinking...
                        </div>
                    </div>
              </div>
            )}
            {isRecording && (
                <div className="flex items-start gap-3 justify-center">
                  <div className="bg-background text-card-foreground rounded-xl px-4 py-3 shadow-sm border flex items-center text-sm md:text-base">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div> Listening...
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="shrink-0 bg-background border-t p-2 md:p-3">
        {imagePreview && (
            <div className="relative w-24 h-24 mb-2 ml-2 rounded-md overflow-hidden border">
                <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeImage}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        )}
        <form onSubmit={handleFormSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="h-12 pr-24"
            disabled={isLoading || isRecording}
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isRecording}>
                <Paperclip className="w-5 h-5" />
                <span className="sr-only">Attach Image</span>
              </Button>
              <Button type="submit" className="ml-2 h-8 px-4" disabled={isLoading || isRecording || (!input.trim() && !imageFile)}>
                Send
              </Button>
          </div>
        </form>
         <div className="flex items-center justify-between mt-2 px-2">
             <div className="flex items-center space-x-4">
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-auto h-8 text-xs">
                        <Languages className="w-3 h-3 mr-1.5"/>
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
         </div>
      </footer>
    </div>
  );
}
