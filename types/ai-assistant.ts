export type AIContext = 'subject' | 'body';

export interface QuickAction {
  id: string;
  label: string;
  icon: string; // Icon name from lucide-react
  prompt: string;
  context: AIContext | 'both';
  description?: string;
}

export interface AIAssistantState {
  isOpen: boolean;
  context: AIContext;
  customPrompt: string;
  result: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AIGenerateOptions {
  prompt: string;
  context: AIContext;
  currentContent?: string;
}

export interface AIGenerateResponse {
  success: boolean;
  text: string | null;
  error: string | null;
}

export interface AIAssistantEnhancedProps {
  context: AIContext;
  currentContent: string;
  onGenerate: (text: string, shouldReplace: boolean) => void;
  onUndo?: () => void;
  disabled?: boolean;
  className?: string;
}
