# Phase 12: CRM Copilot Implementation Plan

**Goal**: Create a conversational interface ("Copilot") that allows users to query CRM data and get AI-driven insights.

## 1. Architecture

### 1.1 AI Configuration (`lib/ai/config.ts`)
*   Add `copilot` strategy.
*   **Model**: Gemini 1.5 Pro (Need higher intelligence for context & tools).
*   **Reasoning**: Complex queries require better reasoning than Flash.

### 1.2 Server Actions (`app/actions/ai_chat.ts`)
*   `chatWithCopilot(messages: Message[], context?: string)`:
    *   **Context**: Needs access to summary data (e.g., "5 recent leads", "Pipeline summary").
    *   **System Prompt**: Defined to act as a helpful CRM assistant.
    *   **Tools**: (Future Phase) Ability to call functions. For now, text-based guidance.

### 1.3 UI Components (`components/ai/CopilotWidget.tsx`)
*   **Floating Widget**: Bottom-right corner.
*   **Chat Interface**: Message history, input field, typing indicator.
*   **Markdown Support**: Render AI responses (lists, bold text).

## 2. Implementation Steps

- [ ] **Config**: Update `lib/ai/config.ts` with `copilot` key.
- [ ] **Backend**: Create `app/actions/ai_chat.ts`.
    *   Implement basic context retrieval (fetch top 5 leads/deals to inject into prompt).
    *   Implement `chatWithCopilot`.
- [ ] **Frontend**: Create `CopilotWidget.tsx` and integration.
    *   [ ] Add `CopilotWidget` to `app/layout.tsx` (or dashboard layout).
    *   [ ] Implement chat UI (user msg vs ai msg).

## 3. Scope (MVP)
*   **Supported Queries**:
    *   "Summarize my recent leads" (fetched via context).
    *   "Draft an email for a client" (general).
    *   "How do I create a new deal?" (knowledge base).
*   **Limitations**: Won't execute database writes (e.g., "Delete lead") yet.
