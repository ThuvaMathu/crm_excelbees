import type { QuickAction } from "@/types/ai-assistant";

export const QUICK_ACTIONS: QuickAction[] = [
  // Subject Actions
  {
    id: 'generate-subjects',
    label: 'Generate Subject Lines',
    icon: 'Sparkles',
    prompt: 'Generate 5 compelling, concise email subject lines based on this context: {content}. Return ONLY a raw JSON array of strings (e.g., ["Subject 1", "Subject 2"]). Do not use markdown code blocks.',
    context: 'subject',
    description: 'Create multiple subject line options',
  },
  {
    id: 'tone-check',
    label: 'Tone Check',
    icon: 'MessageSquare',
    prompt: 'Analyze the tone of this subject line: {content}. Return ONLY a raw JSON array of 5 alternative subject lines with improved tone. Do not use markdown code blocks.',
    context: 'subject',
    description: 'Analyze and improve tone',
  },
  
  // Body Actions
  {
    id: 'summarize',
    label: 'Summarize',
    icon: 'FileText',
    prompt: 'Summarize this email content concisely. Return ONLY a raw JSON array of 3 distinct summary options (e.g., ["Summary A", "Summary B"]). Do not use markdown code blocks. Content: {content}',
    context: 'body',
    description: 'Create a concise summary',
  },
  {
    id: 'professionalize',
    label: 'Professionalize',
    icon: 'Briefcase',
    prompt: 'Rewrite this email in a professional tone. Return ONLY a raw JSON array of 3 distinct versions. Do not use markdown code blocks. Content: {content}',
    context: 'body',
    description: 'Make it more professional',
  },
  {
    id: 'add-cta',
    label: 'Add Call-to-Action',
    icon: 'Target',
    prompt: 'Create 5 compelling call-to-action phrases for this email. Return ONLY a raw JSON array of strings. Do not use markdown code blocks. Content: {content}',
    context: 'body',
    description: 'Add a strong CTA',
  },
  {
    id: 'improve',
    label: 'Improve Writing',
    icon: 'Wand2',
    prompt: 'Improve the writing quality of this email. Return ONLY a raw JSON array of 3 distinct improved versions. Do not use markdown code blocks. Content: {content}',
    context: 'body',
    description: 'Enhance overall quality',
  },
  {
    id: 'fix-grammar',
    label: 'Fix Grammar',
    icon: 'CheckCircle',
    prompt: 'Fix grammar in this email. Return ONLY a raw JSON array with ONE corrected version (as a single item array) and 2 alternative variations. Do not use markdown code blocks. Content: {content}',
    context: 'body',
    description: 'Correct grammar and spelling',
  },
  {
    id: 'make-friendly',
    label: 'Make Friendly',
    icon: 'Smile',
    prompt: 'Rewrite this email in a warm, friendly tone while remaining professional: {content}',
    context: 'body',
    description: 'Add a friendly touch',
  },
];

export function getActionsForContext(context: 'subject' | 'body'): QuickAction[] {
  return QUICK_ACTIONS.filter(
    action => action.context === context || action.context === 'both'
  );
}

export function getActionById(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find(action => action.id === id);
}
