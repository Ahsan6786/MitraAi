
'use client';

// This hook is no longer the primary source of truth for chat history, 
// as history is now managed by Firestore and scoped to conversations.
// It can be removed or kept for other potential uses. For now, we'll keep it
// but recognize that the ChatInterface component now fetches its own data.

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export interface Message {
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
}

interface ChatHistoryContextType {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export const ChatHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  return (
    <ChatHistoryContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = (): ChatHistoryContextType => {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};
