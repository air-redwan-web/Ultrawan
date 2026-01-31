
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export type AppMode = 'Standard' | 'Search' | 'Engineering' | 'Math' | 'Research' | 'Thinking' | 'Shopping';

export interface User {
  name: string;
  email: string;
  picture?: string;
}

export interface AppConfig {
  userName: string;
  hasInitialized: boolean;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  thinking?: string;
  memoryUpdate?: string;
  sources?: {
    uri: string;
    title: string;
  }[];
  media?: {
    data: string;
    mimeType: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
  isArchived?: boolean;
}
