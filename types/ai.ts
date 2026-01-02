
export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMode = 'crm' | 'general';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    mode: ChatMode;
    timestamp: number;
    metadata?: {
        sources?: string[];
        relatedRecordId?: string;
        relatedRecordType?: string;
    };
}

export interface ChatSession {
    id: string;
    userId: string;
    title: string;
    lastMessage: string;
    updatedAt: number;
    createdAt: number;
}
