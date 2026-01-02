# Phase 12: Enterprise CRM Copilot Architecture

**Goal**: Deploy a state-of-the-art, persistent, dual-mode AI assistant.

## 1. System Architecture

### 1.1 Dual-Mode Engine
The Copilot operates in two distinct modes, selectable by the user:

1.  **🛡️ Pilot Mode (CRM Grounded)**
    *   **Purpose**: Data querying, task assistance, navigation.
    *   **Context**: Highly curated CRM data (Recent Leads, Pipeline Stats, Schedule).
    *   **Model**: Gemini 1.5 Pro (High reasoning).
    *   **System Prompt**: "You are an advanced CRM controller. You have access to the user's business data..."

2.  **🌐 General Mode (Web Grounded)**
    *   **Purpose**: Market research, general knowledge, drafting content unrelated to current CRM data.
    *   **Context**: Zero-shot or Web Search results.
    *   **Model**: Gemini 1.5 Flash (Speed) or Pro (Depth).
    *   **System Prompt**: "You are a helpful business assistant..."

### 1.2 Persistent Memory (Firestore)
*   **Path**: `users/{userId}/chat_history/{messageId}` (Simplified for MVP, or sessions).
*   **Schema**:
    ```typescript
    interface ChatMessage {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      mode: 'crm' | 'general';
      timestamp: Timestamp;
      metadata?: {
         sources?: string[]; // For web search results
         relatedRecordId?: string; // If talking about a specific lead
      };
    }
    ```

### 1.3 Web Search Integration
*   **Provider**: Google Gemini Grading (if available) or Mocked Search for MVP (User didn't provide Serper/Google Search specific API keys, so we will build the *interface* and logic to inject search results, possibly using a placeholder service).

## 2. Implementation Steps

- [ ] **Data Layer (`types/ai.ts`)**: Define chat interfaces.
- [ ] **Config (`lib/ai/config.ts`)**: Add `copilot` strategies.
- [ ] **Backend (`app/actions/ai_chat.ts`)**:
    *   `sendMessage(history: ChatMessage[], message: string, mode: ChatMode)`
    *   **Context Builder**: Function to fetch and summarize `Leads` and `Deals` for the CRM context window.
- [ ] **Frontend (`components/ai/CopilotWidget.tsx`)**:
    *   Floating UI with "Expand/Collapse".
    *   Mode Toggles (Badge style).
    *   Real-time streaming (simulated via UI updates for now, as Server Actions wait for full response).
- [ ] **Integration (`app/layout.tsx`)**: Mount globally.

## 3. Tech Stack Compliance
*   **Strict TypeScript**: No `any`.
*   **Next.js Server Actions**: Secure backend execution.
*   **State**: React `useState` / `useOptimistic` for UI fluidity.
