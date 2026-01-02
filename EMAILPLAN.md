# Email Compose Modal & Templates - Complete Feature Specification

## 1. EMAIL COMPOSE MODAL - Core Structure

### 1.1 Modal Layout & UI Components

```
┌──────────────────────────────────────────────────────────────────┐
│ [×] Compose Email                         [−] [□]                 │
├──────────────────────────────────────────────────────────────────┤
│ Template: [Select Template ▼]  [💾 Save] [✨ AI Assist]          │
│ ────────────────────────────────────────────────────────────────│
│ To:      [contact@email.com] [×] [+ Add]  [CC] [BCC]             │
│ From:    [me@company.com ▼]                                       │
│ Reply-To: [Same as From ▼]                                        │
│ Subject: [Invoice #INV-2024-001 - Payment Due]                   │
│          [📝 Variables] [✨ AI Generate Subject]                  │
│ ────────────────────────────────────────────────────────────────│
│ [Rich Text Editor Toolbar]                                        │
│ [B] [I] [U] [Link] [List] [📎] [🖼️] [📋] [✨ AI] [👁️ Preview]    │
│ ────────────────────────────────────────────────────────────────│
│                                                                    │
│ Dear {{contact.first_name}},                                      │
│                                                                    │
│ I hope this email finds you well. I'm writing to follow up on    │
│ Invoice #{{invoice.number}} dated {{invoice.date}}.              │
│                                                                    │
│ [Email body content with formatting...]                           │
│                                                                    │
│ Best regards,                                                      │
│ {{user.signature}}                                                 │
│                                                                    │
│ ────────────────────────────────────────────────────────────────│
│ 📎 Attachments (2):                                               │
│    [📄 Invoice-INV-2024-001.pdf] (245 KB) [×]                    │
│    [📄 Terms-and-Conditions.pdf] (128 KB) [×]                    │
│    [+ Add Files] [📁 From CRM] [🔗 Insert Link]                  │
│ ────────────────────────────────────────────────────────────────│
│ ⚙️ Options:                                                       │
│ ☑ Track email opens          ☑ Log to CRM timeline               │
│ ☑ Track link clicks           ☐ Request read receipt              │
│ ☐ Create follow-up task in [3] days                               │
│ ☐ Schedule send: [Select Date/Time]                               │
│ ────────────────────────────────────────────────────────────────│
│ AI Provider: [Gemini ▼]  Tone: [Professional ▼]                  │
│                                                                    │
│ [💾 Save Draft] [👁️ Preview] [⏰ Schedule ▼] [📤 Send Now]       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

**Main Components:**

```typescript
// EmailComposeModal.tsx
interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: EmailContext;
  defaultTemplate?: string;
  attachments?: Attachment[];
  onSend: (email: Email) => Promise<void>;
}

interface EmailContext {
  type: 'invoice' | 'quote' | 'general' | 'follow-up' | 'reminder';
  relatedRecordId?: string;
  contactId?: string;
  dealId?: string;
  companyId?: string;
  parentEmailId?: string; // For replies
}

interface EmailComposeState {
  // Recipients
  to: EmailRecipient[];
  cc: EmailRecipient[];
  bcc: EmailRecipient[];
  from: string;
  replyTo: string;
  
  // Content
  subject: string;
  body: string; // HTML content
  plainTextBody: string; // Auto-generated fallback
  
  // Template
  selectedTemplate: Template | null;
  hasUnsavedChanges: boolean;
  
  // Attachments
  attachments: Attachment[];
  isUploadingFiles: boolean;
  uploadProgress: Record<string, number>;
  
  // Options
  tracking: {
    trackOpens: boolean;
    trackClicks: boolean;
    trackDownloads: boolean;
  };
  crm: {
    logToTimeline: boolean;
    createFollowUpTask: boolean;
    followUpDays: number;
    updateDealStage: boolean;
  };
  scheduledSendTime: Date | null;
  requestReadReceipt: boolean;
  
  // AI
  aiProvider: 'gemini' | 'openai';
  aiModel: string;
  aiTone: string;
  isAIGenerating: boolean;
  aiSuggestions: AISuggestion[];
  
  // UI State
  showCCBCC: boolean;
  activeTab: 'compose' | 'preview';
  showAIPanel: boolean;
  errors: ValidationError[];
  isSending: boolean;
  isDraft: boolean;
}

interface EmailRecipient {
  id?: string;
  email: string;
  name?: string;
  contactId?: string;
  isValid: boolean;
  isBounced?: boolean;
  isUnsubscribed?: boolean;
  avatar?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  source: 'upload' | 'crm' | 'link';
  crmRecordId?: string;
}
```

### 1.3 Modal Behavior

**Opening Triggers:**
- Click "Send Email" from contact/deal/invoice page
- Click "Reply" or "Forward" from email thread
- Quick action from list views
- Automated trigger from workflow
- Template preview → Use template

**Context Auto-Population:**
- If opened from contact: Auto-fill To field
- If opened from invoice: Attach invoice PDF, fill invoice variables
- If opened from deal: Include deal contact, reference deal details
- If reply: Include original email, populate Re: subject

**Validation Before Send:**
```typescript
interface EmailValidation {
  recipients: {
    hasAtLeastOneTo: boolean;
    allEmailsValid: boolean;
    noBounced: boolean;
    noUnsubscribed: boolean;
  };
  subject: {
    notEmpty: boolean;
    reasonableLength: boolean; // < 200 chars
  };
  body: {
    notEmpty: boolean;
    mergeFieldsResolved: boolean;
  };
  attachments: {
    allUploaded: boolean;
    totalSizeUnderLimit: boolean; // < 25MB
  };
}
```

---

## 2. RECIPIENT MANAGEMENT SYSTEM

### 2.1 Smart Recipient Input Component

**Features:**
- Autocomplete from CRM contacts
- Multi-recipient support with chips
- Drag to reorder
- Real-time validation
- Duplicate detection
- Unsubscribe/bounce warning

**UI Implementation:**

```typescript
<RecipientInput
  field="to"
  recipients={state.to}
  onChange={(recipients) => updateRecipients('to', recipients)}
  placeholder="Add recipients..."
  crmContacts={crmContactsData}
  validation={{
    checkBounced: true,
    checkUnsubscribed: true,
    allowExternal: true,
    maxRecipients: 50
  }}
  showAvatar={true}
  allowGroups={true}
/>
```

**Autocomplete Search:**
```typescript
interface ContactSearchResult {
  id: string;
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
  avatar?: string;
  tags?: string[];
  lastContactDate?: Date;
  emailStatus: 'active' | 'bounced' | 'unsubscribed';
}

// Search algorithm priorities:
// 1. Exact email match
// 2. Name starts with query
// 3. Email starts with query
// 4. Company name contains query
// 5. Recently contacted
```

**Recipient Display:**
```
┌─────────────────────────────────────────────────┐
│ To: [👤 John Smith <john@company.com>] [×]      │
│     [👤 Jane Doe <jane@example.com>] [×]        │
│     [+ Add more recipients]                      │
│                                                  │
│     [+ CC] [+ BCC]                               │
└─────────────────────────────────────────────────┘
```

**Warnings & Validations:**
```
⚠️ Warning: jane@example.com previously bounced
❌ Error: invalid-email is not a valid email address
ℹ️ Info: john@company.com has unsubscribed from marketing emails
```

### 2.2 From Address Management

**From Address Selector:**

```typescript
interface FromAddress {
  id: string;
  email: string;
  name: string;
  type: 'personal' | 'department' | 'shared';
  signature?: string;
  isDefault: boolean;
  canReplyTo: boolean;
}

// Example from addresses
const fromAddresses = [
  {
    id: '1',
    email: 'john.doe@company.com',
    name: 'John Doe',
    type: 'personal',
    signature: 'John Doe\nSales Manager\n...',
    isDefault: true
  },
  {
    id: '2',
    email: 'sales@company.com',
    name: 'Sales Team',
    type: 'department',
    signature: 'Company Sales Team\n...'
  },
  {
    id: '3',
    email: 'billing@company.com',
    name: 'Billing Department',
    type: 'department'
  }
];
```

**Reply-To Options:**
- Same as From (default)
- User's personal email
- Custom email address
- No-reply (discouraged, shown with warning)

---

## 3. RICH TEXT EDITOR

### 3.1 Editor Implementation (TipTap Recommended)

**Toolbar Configuration:**

```typescript
const editorToolbar = [
  // Text formatting
  { type: 'bold', icon: 'B', tooltip: 'Bold (Ctrl+B)' },
  { type: 'italic', icon: 'I', tooltip: 'Italic (Ctrl+I)' },
  { type: 'underline', icon: 'U', tooltip: 'Underline (Ctrl+U)' },
  { type: 'strike', icon: 'S', tooltip: 'Strikethrough' },
  { type: 'separator' },
  
  // Text color & highlight
  { type: 'textColor', icon: '🎨', tooltip: 'Text Color' },
  { type: 'highlight', icon: '🖍️', tooltip: 'Highlight' },
  { type: 'separator' },
  
  // Headers
  { type: 'heading', levels: [1, 2, 3], icon: 'H', tooltip: 'Heading' },
  { type: 'separator' },
  
  // Alignment
  { type: 'alignLeft', icon: '≡', tooltip: 'Align Left' },
  { type: 'alignCenter', icon: '≡', tooltip: 'Align Center' },
  { type: 'alignRight', icon: '≡', tooltip: 'Align Right' },
  { type: 'separator' },
  
  // Lists
  { type: 'bulletList', icon: '•', tooltip: 'Bullet List' },
  { type: 'orderedList', icon: '1.', tooltip: 'Numbered List' },
  { type: 'indent', icon: '→', tooltip: 'Indent' },
  { type: 'outdent', icon: '←', tooltip: 'Outdent' },
  { type: 'separator' },
  
  // Insert elements
  { type: 'link', icon: '🔗', tooltip: 'Insert Link' },
  { type: 'image', icon: '📷', tooltip: 'Insert Image' },
  { type: 'table', icon: '📊', tooltip: 'Insert Table' },
  { type: 'horizontalRule', icon: '─', tooltip: 'Horizontal Line' },
  { type: 'separator' },
  
  // Special features
  { type: 'mergeFields', icon: '📋', tooltip: 'Insert Merge Field' },
  { type: 'aiAssist', icon: '✨', tooltip: 'AI Assistant' },
  { type: 'separator' },
  
  // Undo/Redo
  { type: 'undo', icon: '↶', tooltip: 'Undo (Ctrl+Z)' },
  { type: 'redo', icon: '↷', tooltip: 'Redo (Ctrl+Y)' },
  { type: 'separator' },
  
  // View
  { type: 'preview', icon: '👁️', tooltip: 'Preview' },
  { type: 'fullscreen', icon: '⛶', tooltip: 'Fullscreen' }
];
```

**Editor Extensions:**

```typescript
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';

// Custom extensions
import MergeField from './extensions/MergeField';
import AIAssist from './extensions/AIAssist';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Placeholder.configure({
      placeholder: 'Compose your email...'
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline cursor-pointer'
      }
    }),
    Image.configure({
      inline: true,
      allowBase64: true
    }),
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableCell,
    TableHeader,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true
    }),
    Underline,
    MergeField,
    AIAssist
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    handleContentChange(editor.getHTML());
  }
});
```

### 3.2 Merge Fields System

**Available Merge Fields:**

```typescript
const mergeFieldCategories = {
  contact: {
    label: 'Contact Information',
    fields: [
      { key: 'contact.first_name', label: 'First Name', example: 'John' },
      { key: 'contact.last_name', label: 'Last Name', example: 'Doe' },
      { key: 'contact.full_name', label: 'Full Name', example: 'John Doe' },
      { key: 'contact.email', label: 'Email', example: 'john@example.com' },
      { key: 'contact.phone', label: 'Phone', example: '+1 555-0123' },
      { key: 'contact.mobile', label: 'Mobile', example: '+1 555-0456' },
      { key: 'contact.company', label: 'Company', example: 'Acme Corp' },
      { key: 'contact.job_title', label: 'Job Title', example: 'CEO' },
      { key: 'contact.department', label: 'Department', example: 'Sales' },
      { key: 'contact.address', label: 'Address', example: '123 Main St' },
      { key: 'contact.city', label: 'City', example: 'New York' },
      { key: 'contact.state', label: 'State', example: 'NY' },
      { key: 'contact.zip', label: 'ZIP Code', example: '10001' },
      { key: 'contact.country', label: 'Country', example: 'USA' }
    ]
  },
  
  invoice: {
    label: 'Invoice Details',
    fields: [
      { key: 'invoice.number', label: 'Invoice Number', example: 'INV-2024-001' },
      { key: 'invoice.date', label: 'Invoice Date', example: '2024-12-31' },
      { key: 'invoice.due_date', label: 'Due Date', example: '2025-01-30' },
      { key: 'invoice.amount', label: 'Total Amount', example: '$1,234.56' },
      { key: 'invoice.amount_due', label: 'Amount Due', example: '$1,234.56' },
      { key: 'invoice.amount_paid', label: 'Amount Paid', example: '$0.00' },
      { key: 'invoice.currency', label: 'Currency', example: 'USD' },
      { key: 'invoice.status', label: 'Status', example: 'Pending' },
      { key: 'invoice.link', label: 'View Invoice Link', example: 'https://...' },
      { key: 'invoice.payment_link', label: 'Payment Link', example: 'https://...' },
      { key: 'invoice.pdf_link', label: 'PDF Download Link', example: 'https://...' }
    ]
  },
  
  quote: {
    label: 'Quote Details',
    fields: [
      { key: 'quote.number', label: 'Quote Number', example: 'QT-2024-001' },
      { key: 'quote.date', label: 'Quote Date', example: '2024-12-31' },
      { key: 'quote.expiry_date', label: 'Expiry Date', example: '2025-01-30' },
      { key: 'quote.amount', label: 'Total Amount', example: '$5,678.90' },
      { key: 'quote.status', label: 'Status', example: 'Sent' },
      { key: 'quote.link', label: 'View Quote Link', example: 'https://...' },
      { key: 'quote.accept_link', label: 'Accept Quote Link', example: 'https://...' }
    ]
  },
  
  user: {
    label: 'Your Information',
    fields: [
      { key: 'user.first_name', label: 'Your First Name', example: 'Jane' },
      { key: 'user.last_name', label: 'Your Last Name', example: 'Smith' },
      { key: 'user.full_name', label: 'Your Full Name', example: 'Jane Smith' },
      { key: 'user.email', label: 'Your Email', example: 'jane@company.com' },
      { key: 'user.phone', label: 'Your Phone', example: '+1 555-0789' },
      { key: 'user.job_title', label: 'Your Job Title', example: 'Account Manager' },
      { key: 'user.department', label: 'Your Department', example: 'Sales' },
      { key: 'user.signature', label: 'Your Signature', example: 'Jane Smith\nAccount Manager...' }
    ]
  },
  
  company: {
    label: 'Company Information',
    fields: [
      { key: 'company.name', label: 'Company Name', example: 'Your Company Inc' },
      { key: 'company.address', label: 'Company Address', example: '456 Business Ave' },
      { key: 'company.city', label: 'City', example: 'San Francisco' },
      { key: 'company.state', label: 'State', example: 'CA' },
      { key: 'company.zip', label: 'ZIP', example: '94102' },
      { key: 'company.country', label: 'Country', example: 'USA' },
      { key: 'company.phone', label: 'Phone', example: '+1 555-1234' },
      { key: 'company.website', label: 'Website', example: 'www.company.com' },
      { key: 'company.logo_url', label: 'Logo URL', example: 'https://...' }
    ]
  },
  
  deal: {
    label: 'Deal Information',
    fields: [
      { key: 'deal.name', label: 'Deal Name', example: 'Q4 Enterprise Deal' },
      { key: 'deal.value', label: 'Deal Value', example: '$50,000' },
      { key: 'deal.stage', label: 'Deal Stage', example: 'Negotiation' },
      { key: 'deal.close_date', label: 'Expected Close Date', example: '2025-03-31' },
      { key: 'deal.probability', label: 'Probability', example: '75%' }
    ]
  },
  
  datetime: {
    label: 'Date & Time',
    fields: [
      { key: 'today', label: 'Today\'s Date', example: '2024-12-31' },
      { key: 'tomorrow', label: 'Tomorrow\'s Date', example: '2025-01-01' },
      { key: 'current_time', label: 'Current Time', example: '2:30 PM' },
      { key: 'current_year', label: 'Current Year', example: '2024' },
      { key: 'current_month', label: 'Current Month', example: 'December' },
      { key: 'next_month', label: 'Next Month', example: 'January' }
    ]
  },
  
  custom: {
    label: 'Custom Fields',
    fields: [] // Populated dynamically from CRM custom fields
  }
};
```

**Merge Field UI Component:**

```typescript
<MergeFieldDropdown
  onSelect={(field) => insertMergeField(field)}
  context={emailContext}
  position="bottom-left"
>
  {Object.entries(mergeFieldCategories).map(([key, category]) => (
    <MergeFieldCategory key={key} label={category.label}>
      {category.fields.map(field => (
        <MergeFieldItem
          key={field.key}
          field={field}
          onClick={() => insertMergeField(field)}
        >
          <div className="flex justify-between">
            <span>{field.label}</span>
            <code className="text-xs text-gray-500">
              {`{{${field.key}}}`}
            </code>
          </div>
          <div className="text-xs text-gray-400">
            Example: {field.example}
          </div>
        </MergeFieldItem>
      ))}
    </MergeFieldCategory>
  ))}
</MergeFieldDropdown>
```

**Merge Field Rendering:**

```typescript
// In editor - show as styled badge
<span class="merge-field" data-field="contact.first_name">
  <span class="merge-field-icon">📋</span>
  <span class="merge-field-label">First Name</span>
</span>

// In preview - resolve to actual value
const resolveMergeFields = (html: string, data: any): string => {
  return html.replace(/\{\{([^}]+)\}\}/g, (match, fieldPath) => {
    const value = getNestedValue(data, fieldPath);
    return value !== undefined ? value : match; // Keep original if not found
  });
};

// Handle missing values
const getMergeFieldValue = (fieldPath: string, data: any, fallback: string = '') => {
  const value = getNestedValue(data, fieldPath);
  
  if (value === undefined || value === null) {
    console.warn(`Merge field ${fieldPath} not found`);
    return fallback;
  }
  
  return value;
};
```

### 3.3 Link Insertion

**Link Dialog:**

```
┌────────────────────────────────┐
│ Insert Link                [×] │
├────────────────────────────────┤
│ Text to display:                │
│ [Click here________________]    │
│                                 │
│ URL:                            │
│ [https://example.com_______]    │
│                                 │
│ ☐ Open in new tab               │
│ ☐ Track clicks                  │
│                                 │
│ Quick Links:                    │
│ • Invoice payment link          │
│ • Quote acceptance link         │
│ • Customer portal               │
│ • Support page                  │
│                                 │
│        [Cancel]  [Insert Link]  │
└────────────────────────────────┘
```

**Tracked Links:**
- Automatically shorten and track clicks
- Generate unique tracking ID per email
- Log clicks to CRM timeline
- Show click analytics in email reports

### 3.4 Image Insertion

**Image Options:**
- Upload from computer
- Insert from URL
- Choose from CRM media library
- Company logo quick insert
- Product images from catalog

**Image Dialog:**

```
┌────────────────────────────────┐
│ Insert Image               [×] │
├────────────────────────────────┤
│ [Upload] [URL] [Library]        │
│                                 │
│ [Drag & Drop Area]              │
│   or click to upload            │
│                                 │
│ Image URL:                      │
│ [https://____________]          │
│                                 │
│ Alt text (accessibility):       │
│ [Description_____________]      │
│                                 │
│ Size:                           │
│ ○ Small  ○ Medium  ● Large      │
│                                 │
│ Alignment:                      │
│ ○ Left  ● Center  ○ Right       │
│                                 │
│        [Cancel]  [Insert]       │
└────────────────────────────────┘
```

---

## 4. AI INTEGRATION - COMPLETE SYSTEM

### 4.1 AI Feature Overview

**AI Capabilities:**

1. **Generate Complete Email**
   - From context (invoice, quote, deal)
   - From custom instructions
   - Multiple style options

2. **Improve Content**
   - Grammar and spelling
   - Clarity and conciseness
   - Professional tone
   - Persuasiveness

3. **Rewrite & Adjust**
   - Change tone (formal, casual, friendly)
   - Make shorter/longer
   - Simplify language
   - Add detail

4. **Generate Subject Lines**
   - 5 options per generation
   - Context-aware
   - A/B testing suggestions

5. **Smart Replies**
   - Quick reply suggestions
   - Context from thread
   - Sentiment-aware

6. **Translation**
   - 50+ languages
   - Maintain formatting
   - Cultural adaptation

7. **Content Analysis**
   - Readability score
   - Tone analysis
   - Spam score prediction
   - Deliverability tips

### 4.2 AI Provider Configuration

**Multi-Provider Support:**

```typescript
interface AIProvider {
  id: 'gemini' | 'openai';
  name: string;
  enabled: boolean;
  models: AIModel[];
  apiKey?: string;
  apiEndpoint: string;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing: {
    inputPer1kTokens: number;
    outputPer1kTokens: number;
  };
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  bestFor: string[];
}

const aiProviders: Record<string, AIProvider> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: true,
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    models: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        description: 'Fast, efficient model for quick tasks',
        maxTokens: 8192,
        supportsStreaming: true,
        bestFor: ['quick-generation', 'subject-lines', 'improvements']
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced model for complex tasks',
        maxTokens: 32768,
        supportsStreaming: true,
        bestFor: ['complex-emails', 'long-content', 'analysis']
      }
    ],
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 60000
    },
    pricing: {
      inputPer1kTokens: 0.001,
      outputPer1kTokens: 0.002
    }
  },
  
  openai: {
    id: 'openai',
    name: 'OpenAI',
    enabled: true,
    apiEndpoint: 'https://api.openai.com/v1',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable model for complex tasks',
        maxTokens: 4096,
        supportsStreaming: true,
        bestFor: ['complex-emails', 'creative-content', 'analysis']
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable for most tasks',
        maxTokens: 16384,
        supportsStreaming: true,
        bestFor: ['quick-generation', 'improvements', 'translations']
      }
    ],
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000
    },
    pricing: {
      inputPer1kTokens: 0.005,
      outputPer1kTokens: 0.015
    }
  }
};
```

### 4.3 AI Assistant UI - Sidebar Panel

**Expandable AI Panel:**

```
┌─────────────────────────────────┐
│ ✨ AI Email Assistant           │
├─────────────────────────────────┤
│                                  │
│ Provider: [Gemini ▼]             │
│ Model: [2.0 Flash ▼]             │
│ ─────────────────────────────── │
│                                  │
│ 🎯 Quick Actions:                │
│                                  │
│ [📧 Generate New Email]          │
│ [✍️ Improve Writing]             │
│ [✔️ Fix Grammar]                 │
│ [🎨 Change Tone]                 │
│ [📏 Make Shorter]                │
│ [📐 Make Longer]                 │
│ [🌍 Translate]                   │
│ [📊 Analyze Content]             │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ 📝 Custom Instruction:           │
│ ┌─────────────────────────────┐ │
│ │ Tell AI what you want...    │ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Generate ✨]                    │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ 💡 Tone Presets:                 │
│ ○ Professional                   │
│ ○ Friendly                       │
│ ○ Formal                         │
│ ○ Casual                         │
│ ○ Persuasive                     │
│ ○ Empathetic                     │
│ ○ Apologetic                     │
│ ○ Urgent                         │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ ⚙️ Generation Options:           │
│                                  │
│ Length:                          │
│ ○ Brief (1-2 paragraphs)         │
│ ● Standard (3-4 paragraphs)      │
│ ○ Detailed (5+ paragraphs)       │
│                                  │
│ Include:                         │
│ ☑ Greeting                       │
│ ☑ Context/Background             │
│ ☑ Main message                   │
│ ☑ Call-to-action                 │
│ ☑ Professional closing           │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ 📊 Context Sources:              │
│ ☑ Contact information            │
│ ☑ Invoice/Quote details          │
│ ☑ Previous email thread          │
│ ☑ CRM notes & activities         │
│ ☑ Deal information               │
│                                  │
│ Max context: [5000] tokens       │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ 📈 Usage This Month:             │
│ Requests: 127 / 500              │
│ Tokens: 45.2K / 100K             │
│ Cost: $2.34 / $10.00             │
│                                  │
└─────────────────────────────────┘
```

### 4.4 AI Generation Workflows

#### **Workflow 1: Generate Complete Email**

**User Experience:**
1. User clicks "Generate New Email" or "✨ AI Assist" button
2. AI panel opens with context pre-loaded
3. User configures:
   - Purpose/Type (Invoice, Follow-up, Introduction, etc.)
   - Tone (Professional, Friendly, etc.)
   - Length (Brief, Standard, Detailed)
   - What to include (Greeting, CTA, etc.)
4. Click "Generate"
5. Loading state with progress indicator
6. AI generates 1-3 options
7. User reviews options in comparison view
8. Select one to use or regenerate

**AI Prompt Template:**

```typescript
const buildGenerateEmailPrompt = (context: EmailContext, preferences: AIPreferences): string => {
  return `You are an AI assistant helping to compose a professional business email within a CRM system.

CONTEXT:
- Email Type: ${context.type}
- Purpose: ${context.purpose}
- Recipient: ${context.contact.fullName} (${context.contact.company})
- Relationship Stage: ${context.relationshipStage}

CONTACT INFORMATION:
Name: ${context.contact.fullName}
Company: ${context.contact.company}
Job Title: ${context.contact.jobTitle}
Previous Interactions: ${context.emailHistory.length} emails
Last Contact: ${context.lastContactDate}
Tags: ${context.contact.tags.join(', ')}

${context.type === 'invoice' ? `
INVOICE DETAILS:
Invoice Number: ${context.invoice.number}
Date: ${context.invoice.date}
Due Date: ${context.invoice.dueDate}
Amount: ${context.invoice.amount} ${context.invoice.currency}
Status: ${context.invoice.status}
Payment Link: ${context.invoice.paymentLink}
` : ''}

${context.emailHistory.length > 0 ? `
PREVIOUS EMAIL THREAD:
${context.emailHistory.slice(0, 3).map(email => `
[${email.date}] ${email.from} → ${email.to}
Subject: ${email.subject}
${email.body.substring(0, 200)}...
`).join('\n')}
` : ''}

${context.crmNotes ? `
CRM NOTES:
${context.crmNotes}
` : ''}

USER PREFERENCES:
- Tone: ${preferences.tone}
- Length: ${preferences.length}
- Language: ${preferences.language}
- Include greeting: ${preferences.includeGreeting}
- Include call-to-action: ${preferences.includeCTA}

TASK:
Generate a ${preferences.tone} email for the following purpose: ${context.purpose}

SPECIFIC REQUIREMENTS:
1. Address recipient by name: ${context.contact.firstName}
2. Reference specific details (invoice #, previous conversation, etc.)
3. Maintain ${preferences.tone} tone throughout
4. Length should be ${preferences.length} (Brief: 1-2 paragraphs, Standard: 3-4, Detailed: 5+)
5. Include clear call-to-action if appropriate
6. Use proper business email structure
7. Use merge field format {{field_name}} for dynamic content
8. Include professional closing with sender signature placeholder

DO NOT:
- Use generic or template-sounding language
- Include placeholder text like [Company Name] or [Your Name]
- Be overly formal if casual tone is requested
- Exceed requested length significantly

OUTPUT FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "subject": "Compelling, specific subject line (50-70 characters)",
  "body": "Complete email body in HTML format with proper formatting",
  "tone_analysis": "Brief description of the tone used",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "suggested_followup_days": 3
}`;
};
```

**API Call Implementation:**

```typescript
class AIEmailService {
  private geminiClient: GeminiClient;
  private openaiClient: OpenAIClient;
  
  async generateEmail(
    context: EmailContext,
    preferences: AIPreferences,
    provider: 'gemini' | 'openai' = 'gemini'
  ): Promise<AIGeneratedEmail> {
    
    // 1. Build comprehensive context
    const enrichedContext = await this.enrichContext(context);
    
    // 2. Build prompt
    const prompt = buildGenerateEmailPrompt(enrichedContext, preferences);
    
    // 3. Call AI provider
    let response;
    if (provider === 'gemini') {
      response = await this.callGemini(preferences.model, prompt);
    } else {
      response = await this.callOpenAI(preferences.model, prompt);
    }
    
    // 4. Parse and validate response
    const parsed = this.parseAIResponse(response);
    
    // 5. Log usage
    await this.logAIUsage({
      provider,
      model: preferences.model,
      tokensUsed: response.usage.totalTokens,
      cost: this.calculateCost(provider, response.usage),
      context: context.type,
      userId: context.userId
    });
    
    // 6. Track generation for analytics
    await this.trackGeneration({
      type: 'generate_email',
      success: true,
      context: context.type
    });
    
    return parsed;
  }
  
  private async enrichContext(context: EmailContext): Promise<EmailContext> {
    // Fetch additional context from CRM
    const [contact, emailHistory, crmNotes, relatedDeals] = await Promise.all([
      this.crmService.getContact(context.contactId),
      this.emailService.getEmailThread(context.contactId, 5),
      this.crmService.getNotes(context.contactId),
      this.crmService.getRelatedDeals(context.contactId)
    ]);
    
    return {
      ...context,
      contact: { ...context.contact, ...contact },
      emailHistory,
      crmNotes,
      relatedDeals
    };
  }
  
  private async callGemini(model: string, prompt: string) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new AIProviderError('Gemini API error', await response.json());
    }
    
    return await response.json();
  }
  
  private async callOpenAI(model: string, prompt: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional business email writing assistant integrated into a CRM system. Generate clear, effective, and contextually appropriate emails.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new AIProviderError('OpenAI API error', await response.json());
    }
    
    return await response.json();
  }
  
  private parseAIResponse(response: any): AIGeneratedEmail {
    let content: string;
    
    // Parse based on provider response format
    if (response.candidates) {
      // Gemini response
      content = response.candidates[0].content.parts[0].text;
    } else if (response.choices) {
      // OpenAI response
      content = response.choices[0].message.content;
    } else {
      throw new Error('Unexpected AI response format');
    }
    
    // Remove markdown code fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    const parsed = JSON.parse(content);
    
    // Validate required fields
    if (!parsed.subject || !parsed.body) {
      throw new Error('AI response missing required fields');
    }
    
    return {
      subject: parsed.subject,
      body: parsed.body,
      toneAnalysis: parsed.tone_analysis,
      keyPoints: parsed.key_points || [],
      suggestedFollowupDays: parsed.suggested_followup_days,
      tokensUsed: response.usage?.totalTokens || response.usageMetadata?.totalTokenCount || 0
    };
  }
  
  private calculateCost(provider: string, usage: any): number {
    const config = aiProviders[provider];
    const inputTokens = usage.promptTokens || usage.promptTokenCount || 0;
    const outputTokens = usage.completionTokens || usage.candidatesTokenCount || 0;
    
    return (
      (inputTokens / 1000) * config.pricing.inputPer1kTokens +
      (outputTokens / 1000) * config.pricing.outputPer1kTokens
    );
  }
}
```

#### **Workflow 2: Improve/Rewrite Content**

**User Experience:**
1. User writes draft email
2. Selects text (or entire email)
3. Clicks "Improve Writing" or opens AI panel
4. Chooses improvement type:
   - Fix grammar & spelling
   - Make more professional
   - Make more concise
   - Enhance clarity
   - Change tone
5. AI shows before/after comparison
6. User can accept, reject, or regenerate

**Improvement Prompt:**

```typescript
const buildImprovementPrompt = (
  originalText: string,
  improvementType: string,
  targetTone?: string
): string => {
  const improvementInstructions = {
    grammar: 'Fix all grammar, spelling, and punctuation errors. Maintain the original tone and message.',
    professional: 'Rewrite to be more professional and business-appropriate while preserving the core message.',
    concise: 'Make the text more concise and to-the-point. Remove redundancy while keeping all essential information.',
    detailed: 'Expand the text with more detail and context. Add relevant information to make it more comprehensive.',
    clarity: 'Improve clarity and readability. Make the message clearer and easier to understand.',
    tone_change: `Change the tone to be more ${targetTone} while maintaining the same core message and information.`
  };
  
  return `You are improving email content.

ORIGINAL TEXT:
${originalText}

IMPROVEMENT TASK: ${improvementInstructions[improvementType]}

REQUIREMENTS:
1. Preserve all factual information and key details
2. Maintain any merge fields in {{field}} format
3. Keep the same overall structure unless improving structure is part of the task
4. Do not add information that wasn't in the original
5. Ensure the improved version is natural and conversational, not robotic

OUTPUT:
Return ONLY the improved text in HTML format. Do not include explanations or commentary.`;
};
```

**Before/After Comparison UI:**

```
┌─────────────────────────────────────────────────┐
│ AI Improvement Preview                     [×]  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Improvement: Make more professional              │
│ ─────────────────────────────────────────────── │
│                                                  │
│ BEFORE:                     │ AFTER:             │
│ ──────────────────────────  │ ───────────────── │
│ Hey John,                   │ Dear John,         │
│                             │                    │
│ Just wanted to check in     │ I wanted to follow │
│ about that invoice I sent   │ up regarding       │
│ last week. Let me know if   │ Invoice #INV-001   │
│ you have any questions!     │ sent on Dec 24.    │
│                             │                    │
│ Thanks!                     │ Please let me know │
│                             │ if you have any    │
│                             │ questions.         │
│                             │                    │
│                             │ Best regards,      │
│ ──────────────────────────  │ ───────────────── │
│                                                  │
│ Changes made:                                    │
│ • Formal greeting                                │
│ • Professional language                          │
│ • Specific invoice reference                     │
│ • Professional closing                           │
│                                                  │
│ [Reject] [Regenerate] [Accept Changes]          │
└─────────────────────────────────────────────────┘
```

#### **Workflow 3: Generate Subject Lines**

**User Experience:**
1. User composes email body
2. Clicks "✨ AI Generate" next to subject field
3. AI analyzes body content and context
4. Shows 5 subject line options with ratings
5. User selects one or regenerates
6. Option to A/B test subjects

**Subject Line Generation:**

```typescript
const generateSubjectLines = async (
  emailBody: string,
  context: EmailContext,
  count: number = 5
): Promise<SubjectLineSuggestion[]> => {
  
  const prompt = `Generate ${count} professional email subject lines.

EMAIL BODY:
${emailBody}

CONTEXT:
- Email Type: ${context.type}
- Recipient: ${context.contact.fullName} (${context.contact.company})
- Related: ${context.recordType} #${context.recordNumber}
- Previous Subject Lines Used: ${context.previousSubjects?.join(', ') || 'None'}

REQUIREMENTS:
1. Clear and specific about email content
2. Professional and appropriate tone
3. 40-60 characters (ideal for mobile preview)
4. Action-oriented when appropriate
5. Include relevant reference numbers or dates
6. No clickbait or misleading language
7. Vary the style across the ${count} options (some direct, some engaging, some formal)

OUTPUT:
Return a JSON array of objects with this structure:
[
  {
    "subject": "Subject line text",
    "style": "direct|engaging|formal|urgent",
    "length": 45,
    "score": 8.5,
    "reasoning": "Why this subject line works"
  }
]

Order by score (highest first).`;

  const response = await aiService.generate(prompt);
  return JSON.parse(response);
};
```

**Subject Line Selection UI:**

```
┌─────────────────────────────────────────────────┐
│ AI Subject Line Suggestions                [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ Select a subject line:                          │
│                                                  │
│ ⭐ 9.2  [Use This]                               │
│ Invoice #INV-2024-001 - Payment Due Jan 30     │
│ Style: Direct  |  Length: 47 chars              │
│ ℹ️ Clear, specific, includes due date           │
│ ─────────────────────────────────────────────── │
│                                                  │
│ ⭐ 8.8  [Use This]                               │
│ Action Required: Invoice INV-2024-001           │
│ Style: Urgent  |  Length: 41 chars              │
│ ℹ️ Creates urgency while staying professional   │
│ ─────────────────────────────────────────────── │
│                                                  │
│ ⭐ 8.5  [Use This]                               │
│ Following Up: Your Invoice from Dec 24          │
│ Style: Engaging  |  Length: 43 chars            │
│ ℹ️ Friendly but professional follow-up tone     │
│ ─────────────────────────────────────────────── │
│                                                  │
│ ⭐ 8.3  [Use This]                               │
│ Payment Information for INV-2024-001            │
│ Style: Formal  |  Length: 40 chars              │
│ ℹ️ Very professional, banking-style language    │
│ ─────────────────────────────────────────────── │
│                                                  │
│ ⭐ 7.9  [Use This]                               │
│ Quick Reminder: Invoice Due Soon                │
│ Style: Casual  |  Length: 36 chars              │
│ ℹ️ Gentle reminder, relationship-focused        │
│                                                  │
│ [🔄 Generate More] [💡 Custom Instruction]      │
└─────────────────────────────────────────────────┘
```

#### **Workflow 4: Content Analysis**

**Analyze email before sending:**

```typescript
interface EmailAnalysis {
  readability: {
    score: number; // 0-100
    grade: string; // "Easy", "Moderate", "Complex"
    sentenceCount: number;
    avgSentenceLength: number;
    suggestions: string[];
  };
  tone: {
    primary: string; // "professional", "friendly", "formal"
    sentiment: number; // -1 to 1
    confidence: number;
    keywords: string[];
  };
  deliverability: {
    spamScore: number; // 0-10 (lower is better)
    spamTriggers: string[];
    suggestions: string[];
  };
  engagement: {
    predictedOpenRate: number; // Based on subject line
    predictedClickRate: number; // Based on CTAs
    ctaCount: number;
    linkCount: number;
  };
  length: {
    wordCount: number;
    characterCount: number;
    estimatedReadTime: string; // "30 seconds"
    recommendation: string;
  };
}
```

**Analysis UI:**

```
┌─────────────────────────────────────────────────┐
│ 📊 Email Analysis                          [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ 📖 Readability                     Score: 78/100│
│ ────────────────────────────────────────────    │
│ Grade: Easy to read                              │
│ Avg sentence length: 15 words ✓                 │
│ ✓ Good: Clear and concise sentences             │
│ ⚠️ Tip: Consider breaking up paragraph 3        │
│                                                  │
│ 😊 Tone Analysis                  Professional  │
│ ────────────────────────────────────────────    │
│ Sentiment: Positive (0.7)                       │
│ Confidence: 94%                                  │
│ ✓ Appropriate for business context              │
│                                                  │
│ 📧 Deliverability                 Spam: 2.1/10  │
│ ────────────────────────────────────────────    │
│ ✓ Low spam score - likely to be delivered       │
│ ✓ No spam trigger words detected                │
│ ✓ Good balance of text and formatting           │
│                                                  │
│ 🎯 Engagement Prediction                        │
│ ────────────────────────────────────────────    │
│ Expected open rate: 42-48%                      │
│ Expected click rate: 8-12%                      │
│ CTAs found: 2 ✓                                  │
│ Links: 3 ✓                                       │
│                                                  │
│ 📏 Length                        Est. Read: 45s │
│ ────────────────────────────────────────────    │
│ Word count: 187                                  │
│ Character count: 1,024                           │
│ ✓ Optimal length for engagement                 │
│                                                  │
│ [Close] [View Detailed Report]                  │
└─────────────────────────────────────────────────┘
```

### 4.5 AI Settings & Preferences

**User-Level Preferences:**

```typescript
interface UserAIPreferences {
  // Provider
  defaultProvider: 'gemini' | 'openai';
  defaultModel: string;
  
  // Generation preferences
  defaultTone: 'professional' | 'friendly' | 'formal' | 'casual';
  defaultLength: 'brief' | 'standard' | 'detailed';
  defaultLanguage: string;
  
  // Context inclusion
  autoIncludeContactInfo: boolean;
  autoIncludeEmailHistory: boolean;
  autoIncludeCRMNotes: boolean;
  autoIncludeDealInfo: boolean;
  maxContextTokens: number;
  
  // Features
  autoGenerateSubject: boolean;
  showMultipleOptions: boolean;
  alwaysAnalyzeBeforeSend: boolean;
  suggestImprovements: boolean;
  
  // Privacy & safety
  excludeSensitiveData: boolean;
  reviewBeforeApplying: boolean;
  logAIUsage: boolean;
  
  // UI preferences
  aiPanelPosition: 'right' | 'bottom' | 'floating';
  showAIShortcuts: boolean;
  keyboardShortcuts: Record<string, string>;
}
```

**Organization-Level Settings:**

```typescript
interface OrganizationAISettings {
  // Provider management
  enabledProviders: ('gemini' | 'openai')[];
  providerPriority: string[];
  apiKeys: Record<string, string>;
  
  // Usage limits
  monthlyBudget: number;
  perUserDailyLimit: number;
  perUserMonthlyLimit: number;
  
  // Alerts
  usageAlerts: {
    threshold: number; // Percentage of budget
    notifyAdmins: string[];
    notifyUser: boolean;
  };
  
  // Feature control
  allowedFeatures: {
    generateEmail: boolean;
    improveContent: boolean;
    generateSubjects: boolean;
    translation: boolean;
    analysis: boolean;
    smartReplies: boolean;
  };
  
  // Data & privacy
  dataRetention: 'none' | 'anonymized' | 'full';
  retentionDays: number;
  allowExternalProviders: boolean;
  
  // Compliance
  requireApprovalForExternal: boolean;
  auditLogging: boolean;
  gdprCompliant: boolean;
}
```

---

## 5. EMAIL TEMPLATES SYSTEM

### 5.1 Template Management Interface

**Template Library View:**

```
┌────────────────────────────────────────────────────────────┐
│ 📧 Email Templates                    [+ Create Template]  │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Search: [_____________] 🔍  Category: [All ▼]  Sort: [▼]   │
│ Filter: [My Templates] [Team Templates] [Company Templates] │
│                                                              │
│ ┌──────────────────┐ ┌──────────────────┐ ┌───────────────┐│
│ │ 📄 Invoice       │ │ 📋 Quote         │ │ 🔔 Payment    ││
│ │ Payment Request  │ │ Follow-up        │ │ Reminder      ││
│ │                  │ │                  │ │               ││
│ │ Used: 128 times  │ │ Used: 45 times   │ │ Used: 89 times││
│ │ Last: 2 days ago │ │ Last: 1 week ago │ │ Last: Today   ││
│ │ ⭐⭐⭐⭐⭐        │ │ ⭐⭐⭐           │ │ ⭐⭐⭐⭐       ││
│ │                  │ │                  │ │               ││
│ │ [Preview] [Edit] │ │ [Preview] [Edit] │ │ [Preview]     ││
│ │ [Use] [Duplicate]│ │ [Use] [Duplicate]│ │ [Edit] [Use]  ││
│ └──────────────────┘ └──────────────────┘ └───────────────┘│
│                                                              │
│ ┌──────────────────┐ ┌──────────────────┐ ┌───────────────┐│
│ │ 👋 Welcome       │ │ 📞 Meeting       │ │ 🎉 Thank You  ││
│ │ New Client       │ │ Follow-up        │ │ Purchase      ││
│ │                  │ │                  │ │               ││
│ │ Used: 67 times   │ │ Used: 156 times  │ │ Used: 234     ││
│ │ ⭐⭐⭐⭐          │ │ ⭐⭐⭐⭐⭐         │ │ ⭐⭐⭐⭐⭐      ││
│ │                  │ │                  │ │               ││
│ │ [Preview] [Edit] │ │ [Preview] [Edit] │ │ [Preview]     ││
│ │ [Use] [Duplicate]│ │ [Use] [Duplicate]│ │ [Edit] [Use]  ││
│ └──────────────────┘ └──────────────────┘ └───────────────┘│
│                                                              │
│ Showing 6 of 24 templates              [Load More]          │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Template Categories & Pre-built Templates

**System Template Categories:**

1. **Invoice & Billing**
   - Invoice sent notification
   - Payment reminder (gentle - 7 days before due)
   - Payment reminder (firm - due date)
   - Payment overdue (1st reminder)
   - Payment overdue (2nd reminder)
   - Payment overdue (final notice)
   - Payment received confirmation
   - Payment plan proposal
   - Receipt confirmation

2. **Quotes & Proposals**
   - Quote sent notification
   - Quote follow-up (no response)
   - Quote revision sent
   - Quote acceptance thank you
   - Quote expiration reminder
   - Proposal sent
   - Proposal follow-up
   - Contract signing request

3. **Client Onboarding**
   - Welcome new client
   - Account setup instructions
   - Next steps after signup
   - Onboarding checklist
   - Welcome call scheduling
   - Resources and documentation

4. **Follow-ups**
   - General check-in
   - After meeting/call
   - After demo/presentation
   - After proposal submission
   - After no response (1st, 2nd, 3rd)
   - After event/webinar attendance
   - Post-purchase follow-up

5. **Support & Service**
   - Support ticket acknowledgment
   - Support ticket update
   - Support ticket resolved
   - Service appointment reminder
   - Service completed
   - Feedback request
   - Issue escalation

6. **Marketing & Engagement**
   - Newsletter/update
   - Product launch announcement
   - Feature update
   - Event invitation
   - Webinar invitation
   - Case study share
   - Holiday greeting

7. **Relationship Building**
   - Introduction email
   - Congratulations (promotion, achievement)
   - Happy birthday
   - Work anniversary
   - Quarterly check-in
   - Value-add content sharing

8. **Internal**
   - Team notification
   - Deal handoff
   - Manager update
   - Weekly summary
   - Task assignment

### 5.3 Template Structure

**Template Data Model:**

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  
  // Content
  subject: string;
  body: string; // HTML
  plainTextBody?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  
  // Usage
  usageCount: number;
  lastUsedAt?: Date;
  rating: number; // 0-5
  
  // Access & sharing
  visibility: 'private' | 'team' | 'organization';
  sharedWith?: string[]; // User/team IDs
  isSystem: boolean; // System templates can't be deleted
  
  // Configuration
  context: TemplateContext;
  variables: TemplateVariable[];
  attachments: TemplateAttachment[];
  
  // AI
  aiGenerated: boolean;
  aiProvider?: string;
  canAIImprove: boolean;
  
  // Settings
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    logToCRM: boolean;
    createFollowUpTask: boolean;
    followUpDays?: number;
    defaultFromAddress?: string;
  };
  
  // Analytics
  analytics: {
    sends: number;
    opens: number;
    clicks: number;
    replies: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgReplyRate: number;
  };
}

interface TemplateContext {
  applicableTypes: ('invoice' | 'quote' | 'deal' | 'contact' | 'general')[];
  requiredFields: string[]; // Which merge fields are required
  recommendedFor: string[]; // Deal stages, contact segments, etc.
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: any[]; // For select type
  helpText?: string;
}

interface TemplateAttachment {
  id: string;
  name: string;
  type: 'static' | 'dynamic'; // Static = same file always, Dynamic = e.g., invoice PDF
  url?: string;
  dynamicType?: 'invoice' | 'quote' | 'contract';
}
```

### 5.4 Template Editor

**Template Creation/Edit Interface:**

```
┌────────────────────────────────────────────────────────────┐
│ [←] Create Email Template                    [Save] [Cancel]│
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Template Name:                                               │
│ [Invoice Payment Request________________________]            │
│                                                              │
│ Description (optional):                                      │
│ [Professional payment request for outstanding invoices___]   │
│                                                              │
│ Category: [Invoice & Billing ▼]                             │
│ Visibility: ○ Private  ● Team  ○ Organization                │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ Subject Line:                                                │
│ [Invoice #{{invoice.number}} - Payment Due {{invoice.due}]  │
│ [📋 Insert Variable] [✨ AI Generate]                        │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ Email Body:                                                  │
│ [Rich Text Editor with full toolbar]                        │
│                                                              │
│ Dear {{contact.first_name}},                                 │
│                                                              │
│ I hope this email finds you well. I'm writing to follow     │
│ up on Invoice #{{invoice.number}} dated {{invoice.date}},   │
│ which has a payment due date of {{invoice.due_date}}.       │
│                                                              │
│ Invoice Details:                                             │
│ • Amount: {{invoice.amount}}                                 │
│ • Due Date: {{invoice.due_date}}                             │
│ • Payment Link: {{invoice.payment_link}}                     │
│                                                              │
│ [Continue editing...]                                        │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ Attachments:                                                 │
│ ☑ Auto-attach invoice PDF                                    │
│ [+ Add Static Attachment]                                    │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ Template Settings:                                           │
│ ☑ Track email opens                                          │
│ ☑ Track link clicks                                          │
│ ☑ Log to CRM timeline                                        │
│ ☐ Create follow-up task after [3] days                       │
│                                                              │
│ Default From Address: [Use sender's default ▼]              │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ Applicable To:                                               │
│ ☑ Invoices  ☐ Quotes  ☐ Deals  ☐ General                    │
│                                                              │
│ Required Fields:                                             │
│ • contact.first_name                                         │
│ • invoice.number                                             │
│ • invoice.date                                               │
│ • invoice.due_date                                           │
│ • invoice.amount                                             │
│                                                              │
│ [Add Required Field ▼]                                       │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ [Preview Template] [Test Send] [Save Template]              │
└────────────────────────────────────────────────────────────┘
```

### 5.5 Template Usage in Compose Modal

**Template Selection:**

```typescript
<TemplateSelector
  templates={filteredTemplates}
  context={emailContext}
  onSelect={(template) => applyTemplate(template)}
  showPreview={true}
>
  <TemplateDropdown>
    {templates.map(template => (
      <TemplateOption key={template.id}>
        <div className="template-header">
          <span className="template-name">{template.name}</span>
          <span className="template-usage">Used {template.usageCount}×</span>
        </div>
        <div className="template-preview">
          {template.subject}
        </div>
        <div className="template-meta">
          <Rating value={template.rating} />
          <span>{template.category}</span>
        </div>
      </TemplateOption>
    ))}
  </TemplateDropdown>
</TemplateSelector>
```

**Template Application:**

```typescript
const applyTemplate = async (template: EmailTemplate) => {
  // 1. Load template content
  const content = await templateService.getTemplate(template.id);
  
  // 2. Check required fields
  const missingFields = content.requiredFields.filter(
    field => !hasValue(emailContext, field)
  );
  
  if (missingFields.length > 0) {
    showWarning(`Missing required fields: ${missingFields.join(', ')}`);
    // Offer to continue anyway or cancel
  }
  
  // 3. Resolve merge fields with available data
  const resolvedSubject = resolveMergeFields(content.subject, emailContext);
  const resolvedBody = resolveMergeFields(content.body, emailContext);
  
  // 4. Apply to compose modal
  setEmailState({
    subject: resolvedSubject,
    body: resolvedBody,
    selectedTemplate: template,
    tracking: template.settings.trackOpens,
    // ... other settings from template
  });
  
  // 5. Add template attachments
  if (content.attachments.length > 0) {
    await loadTemplateAttachments(content.attachments);
  }
  
  // 6. Track template usage
  await templateService.incrementUsage(template.id);
};
```

### 5.6 Template Analytics

**Template Performance Dashboard:**

```
┌────────────────────────────────────────────────────────────┐
│ Template: Invoice Payment Request                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Performance Overview (Last 30 Days)                      │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ Total Sends: 128        Opens: 102 (79.7%)                  │
│ Clicks: 45 (35.2%)      Replies: 23 (18.0%)                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Opens  ████████████████████████░░░░░░ 79.7%         │    │
│ │ Clicks ██████████░░░░░░░░░░░░░░░░░░░░ 35.2%         │    │
│ │ Replies ██████░░░░░░░░░░░░░░░░░░░░░░░░ 18.0%        │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ 📈 Trend (vs previous 30 days)                              │
│ Opens: +5.2% ↑    Clicks: +2.1% ↑    Replies: -1.3% ↓      │
│                                                              │
│ ⭐ User Rating: 4.7/5.0 (24 ratings)                        │
│                                                              │
│ 💡 AI Insights:                                              │
│ • Subject line performs 23% better than average              │
│ • Best send time: Tuesday 10 AM                             │
│ • Recipients prefer shorter version (-15% words)            │
│ • Including payment link increases clicks by 42%            │
│                                                              │
│ [View Detailed Analytics] [A/B Test Variations]             │
└────────────────────────────────────────────────────────────┘
```

---

## 6. ATTACHMENT MANAGEMENT

### 6.1 Attachment Sources

**Multiple Attachment Options:**

1. **Upload from Computer**
   - Drag & drop interface
   - File browser selection
   - Multi-file support
   - Progress indicators

2. **From CRM Documents**
   - Browse CRM file library
   - Filter by type/date
   - Recent files quick access
   - Related record files

3. **From Cloud Storage** (Future enhancement)
   - Google Drive integration
   - Dropbox integration
   - OneDrive integration

4. **Dynamic Attachments**
   - Auto-attach invoice PDF
   - Auto-attach quote PDF
   - Auto-attach contract
   - Auto-attach report

### 6.2 Attachment UI

```
┌────────────────────────────────────────────────────────────┐
│ 📎 Attachments                                              │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ [Drag files here or click to browse]                        │
│                                                              │
│ ────────────────────────────────────────────────────────── │
│                                                              │
│ Attached Files (3):                                          │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📄 Invoice-INV-2024-001.pdf                          │   │
│ │ 245 KB  •  Auto-attached  •  [Preview] [×]          │   │
│ │ ████████████████████████████████████████ 100%        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📄 Terms-and-Conditions.pdf                          │   │
│ │ 128 KB  •  From CRM Library  •  [Preview] [×]       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📊 Q4-Report.xlsx                                    │   │
│ │ 1.2 MB  •  Uploading...  •  [Cancel]                │   │
│ │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 35%           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Total size: 1.5 MB / 25 MB limit                            │
│                                                              │
│ [+ Upload Files] [📁 From CRM] [🔗 Insert as Link]         │
└────────────────────────────────────────────────────────────┘
```

### 6.3 Attachment Data Model

```typescript
interface Attachment {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // MIME type
  
  // Source
  source: 'upload' | 'crm' | 'cloud' | 'dynamic';
  sourceId?: string; // CRM document ID or cloud file ID
  
  // File data
  url?: string; // For existing files
  file?: File; // For uploads
  uploadProgress?: number; // 0-100
  
  // Status
  status: 'uploading' | 'ready' | 'error';
  error?: string;
  
  // Metadata
  uploadedAt?: Date;
  uploadedBy?: string;
  
  // Settings
  includeInEmail: boolean;
  convertToLink: boolean; // Send as downloadable link instead of attachment
  
  // Tracking
  trackDownloads: boolean;
  downloadCount?: number;
}

// Attachment service
class AttachmentService {
  async uploadFile(file: File): Promise<Attachment> {
    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      source: 'upload',
      file: file,
      uploadProgress: 0,
      status: 'uploading',
      includeInEmail: true,
      trackDownloads: false
    };
    
    // Upload with progress tracking
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        attachment.uploadProgress = (e.loaded / e.total) * 100;
        this.notifyProgress(attachment);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        attachment.url = response.url;
        attachment.status = 'ready';
        this.notifyComplete(attachment);
      } else {
        attachment.status = 'error';
        attachment.error = 'Upload failed';
        this.notifyError(attachment);
      }
    });
    
    xhr.open('POST', '/api/attachments/upload');
    xhr.send(formData);
    
    return attachment;
  }
  
  async attachFromCRM(documentId: string): Promise<Attachment> {
    const doc = await crmService.getDocument(documentId);
    
    return {
      id: generateId(),
      name: doc.name,
      size: doc.size,
      type: doc.type,
      source: 'crm',
      sourceId: documentId,
      url: doc.url,
      status: 'ready',
      includeInEmail: true,
      trackDownloads: true
    };
  }
  
  async validateAttachments(attachments: Attachment[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
    
    if (totalSize > 25 * 1024 * 1024) { // 25 MB limit
      errors.push('Total attachment size exceeds 25 MB limit');
    }
    
    const invalidTypes = attachments.filter(a => 
      !this.isAllowedType(a.type)
    );
    
    if (invalidTypes.length > 0) {
      errors.push(`File types not allowed: ${invalidTypes.map(a => a.name).join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private isAllowedType(mimeType: string): boolean {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];
    
    return allowed.includes(mimeType);
  }
}
```

---

## 7. EMAIL TRACKING & ANALYTICS

### 7.1 Tracking Features

**What to Track:**

1. **Email Opens**
   - First open timestamp
   - Total open count
   - Unique opens
   - Open location (IP/city)
   - Device/client used

2. **Link Clicks**
   - Which links clicked
   - Click timestamps
   - Click count per link
   - Click location

3. **Attachment Downloads**
   - Which attachments downloaded
   - Download timestamps
   - Download count

4. **Replies**
   - Reply received
   - Reply timestamp
   - Reply sentiment (AI analysis)

5. **Forwards**
   - Email forwarded
   - Forward count

### 7.2 Tracking Implementation

**Tracking Pixel for Opens:**

```typescript
const generateTrackingPixel = (emailId: string, recipientId: string): string => {
  const trackingId = generateSecureToken();
  
  // Store tracking ID mapping
  await trackingService.createTracking({
    trackingId,
    emailId,
    recipientId,
    type: 'open'
  });
  
  // Return 1x1 transparent GIF URL
  return `<img src="${config.trackingUrl}/pixel/${trackingId}.gif" 
          width="1" height="1" alt="" style="display:none;" />`;
};

// Tracking pixel endpoint
app.get('/pixel/:trackingId.gif', async (req, res) => {
  const { trackingId } = req.params;
  
  // Log the open
  await trackingService.logOpen(trackingId, {
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer']
  });
  
  // Return transparent GIF
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});
```

**Link Tracking:**

```typescript
const trackifyLinks = (html: string, emailId: string): string => {
  const $ = cheerio.load(html);
  
  $('a').each((i, elem) => {
    const originalUrl = $(elem).attr('href');
    
    if (originalUrl && !originalUrl.startsWith('mailto:')) {
      const trackingId = generateSecureToken();
      
      // Store tracking
      trackingService.createLinkTracking({
        trackingId,
        emailId,
        originalUrl,
        linkText: $(elem).text()
      });
      
      // Replace with tracking URL
      const trackedUrl = `${config.trackingUrl}/click/${trackingId}`;
      $(elem).attr('href', trackedUrl);
    }
  });
  
  return $.html();
};

// Click tracking endpoint
app.get('/click/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  
  // Log the click
  const tracking = await trackingService.logClick(trackingId, {
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Redirect to original URL
  res.redirect(tracking.originalUrl);
});
```

### 7.3 Email Analytics Dashboard

**Individual Email Stats:**

```
┌────────────────────────────────────────────────────────────┐
│ Email: Invoice #INV-2024-001 - Payment Due                 │
│ Sent: Dec 31, 2024 10:30 AM  •  To: john@company.com       │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Engagement Overview                                       │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│  Status: ● Opened  •  Last activity: 2 hours ago            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ ✉️ Sent  │  │ 👁️ Opened│  │ 🖱️ Click │  │ 💬 Reply │   │
│  │ Dec 31   │  │ Dec 31   │  │ Dec 31   │  │ Not yet  │   │
│  │ 10:30 AM │  │ 2:45 PM  │  │ 2:47 PM  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 📈 Activity Timeline                                         │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│  10:30 AM  ✉️  Email sent                                    │
│  02:45 PM  👁️  Email opened (Chrome, Desktop)               │
│  02:47 PM  🖱️  Clicked "View Invoice" link                  │
│  02:48 PM  📄  Downloaded invoice PDF                        │
│  03:15 PM  👁️  Email opened again (Mobile)                  │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 🔗 Link Activity                                             │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│  View Invoice         2 clicks  •  Last: 3:15 PM             │
│  Payment Portal       0 clicks                               │
│  Contact Support      0 clicks                               │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 📎 Attachment Activity                                       │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│  Invoice-INV-2024-001.pdf    ✓ Downloaded  •  2:48 PM      │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 💡 AI Insights                                               │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│  • Contact engaged quickly (4 hours after sending)           │
│  • Opened on multiple devices (good engagement)              │
│  • Downloaded invoice but hasn't clicked payment link        │
│  ⚡ Suggested action: Send payment reminder in 2 days       │
│                                                              │
│ [Send Follow-up] [Add to CRM Note] [Create Task]            │
└────────────────────────────────────────────────────────────┘
```

**Aggregate Analytics:**

```
┌────────────────────────────────────────────────────────────┐
│ Email Campaign Analytics                                    │
│ Template: Invoice Payment Request  •  Last 30 days          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Key Metrics                                               │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│  Sent: 128      Delivered: 126 (98.4%)    Bounced: 2 (1.6%)│
│  Opened: 102 (79.7%)    Clicked: 45 (35.2%)                │
│  Replied: 23 (18.0%)    Unsubscribed: 1 (0.8%)             │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 📈 Performance Over Time                                     │
│                                                              │
│  [Line chart showing opens/clicks/replies over 30 days]     │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ ⏰ Best Send Times                                           │
│                                                              │
│  Tuesday 10:00 AM    Open rate: 85%                         │
│  Wednesday 2:00 PM   Open rate: 82%                         │
│  Thursday 9:00 AM    Open rate: 78%                         │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 🎯 Top Performing Subject Lines                             │
│                                                              │
│  "Action Required: Invoice Due Tomorrow"    92% open rate   │
│  "Invoice #INV-XXX - Payment Due [Date]"    79% open rate   │
│  "Payment Reminder: Invoice INV-XXX"        76% open rate   │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ 💬 Reply Sentiment Analysis                                 │
│                                                              │
│  Positive: 65%     ████████████████░░░░░░                   │
│  Neutral:  25%     ██████░░░░░░░░░░░░░░░░                   │
│  Negative: 10%     ██░░░░░░░░░░░░░░░░░░░░                   │
│                                                              │
│ [Export Report] [Compare Templates] [A/B Test]              │
└────────────────────────────────────────────────────────────┘
```

---

## 8. SCHEDULING & AUTOMATION

### 8.1 Schedule Send

**Schedule UI:**

```
┌────────────────────────────────────────┐
│ Schedule Email                    [×]  │
├────────────────────────────────────────┤
│                                         │
│ When to send:                          │
│                                         │
│ ○ Send now                             │
│ ● Schedule for later                   │
│                                         │
│ Date: [Jan 5, 2025 ▼]                  │
│ Time: [10:00 AM ▼]                     │
│ Timezone: [PST ▼]                      │
│                                         │
│ ────────────────────────────────────── │
│                                         │
│ 💡 Suggested times (based on past data)│
│                                         │
│ • Tuesday, Jan 7 at 10:00 AM           │
│   Best open rate for this contact      │
│                                         │
│ • Wednesday, Jan 8 at 2:00 PM          │
│   High engagement time                 │
│                                         │
│ ────────────────────────────────────── │
│                                         │
│ Options:                                │
│ ☐ Cancel if reply received before send │
│ ☐ Adjust for recipient's timezone      │
│                                         │
│        [Cancel]  [Schedule Email]      │
└────────────────────────────────────────┘
```

### 8.2 Automated Email Workflows

**Workflow Triggers:**

```typescript
interface EmailWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Trigger
  trigger: {
    type: 'deal_stage_change' | 'invoice_sent' | 'invoice_overdue' | 
          'quote_sent' | 'no_response' | 'contact_created' | 'task_completed' |
          'date_field' | 'custom_event';
    conditions: TriggerCondition[];
  };
  
  // Actions
  actions: EmailWorkflowAction[];
  
  // Timing
  timing: {
    delay?: number; // Minutes/hours/days after trigger
    sendAt?: string; // Specific time of day
    skipWeekends?: boolean;
    respectTimezone?: boolean;
  };
  
  // Filters
  filters: {
    contactSegments?: string[];
    dealValue?: { min?: number; max?: number };
    customFilters?: Record<string, any>;
  };
  
  // Statistics
  stats: {
    triggered: number;
    sent: number;
    skipped: number;
    lastRun?: Date;
  };
}

interface EmailWorkflowAction {
  type: 'send_email' | 'create_task' | 'update_field' | 'notify_user';
  config: {
    templateId?: string;
    fromAddress?: string;
    subject?: string;
    body?: string;
    assignTo?: string;
    updateField?: string;
    updateValue?: any;
  };
}
```

**Common Automated Workflows:**

1. **Invoice Payment Follow-up Sequence**
   - Day 0: Invoice sent (immediate)
   - Day 7: Friendly reminder (7 days before due)
   - Day 0 (due date): Payment due today
   - Day 3: Payment overdue - first reminder
   - Day 7: Payment overdue - second reminder
   - Day 14: Payment overdue - final notice

2. **Lead Nurturing Sequence**
   - Day 0: Welcome email
   - Day 2: Value proposition
   - Day 5: Case study/testimonial
   - Day 9: Product demo offer
   - Day 14: Special offer
   - Day 21: Final follow-up

3. **Quote Follow-up Sequence**
   - Day 0: Quote sent
   - Day 3: Check-in
   - Day 7: Additional information
   - Day 14: Expiration reminder
   - Day 20: Final reminder before expiration

4. **No Response Follow-up**
   - After 3 days: First follow-up
   - After 7 days: Second follow-up
   - After 14 days: Final follow-up

### 8.3 Smart Send Time Optimization

**AI-Powered Send Time:**

```typescript
interface SendTimeOptimization {
  enableSmartTiming: boolean;
  
  // Analysis factors
  factors: {
    recipientPastOpenTimes: boolean;
    recipientTimezone: boolean;
    industryBenchmarks: boolean;
    dayOfWeek: boolean;
    avoidWeekends: boolean;
    businessHoursOnly: boolean;
  };
  
  // Optimization settings
  settings: {
    optimizeFor: 'opens' | 'clicks' | 'replies';
    allowWindow: {
      start: string; // "09:00"
      end: string;   // "17:00"
    };
    timezone: string;
  };
}

const calculateOptimalSendTime = async (
  recipientId: string,
  optimization: SendTimeOptimization
): Promise<Date> => {
  // 1. Analyze recipient's past email opens
  const openHistory = await analyticsService.getOpenTimes(recipientId);
  
  // 2. Get recipient timezone
  const timezone = await contactService.getTimezone(recipientId);
  
  // 3. Get industry benchmarks
  const benchmarks = await analyticsService.getIndustryBenchmarks(
    recipientIndustry
  );
  
  // 4. Calculate best time
  const optimalTime = aiService.predictBestSendTime({
    openHistory,
    timezone,
    benchmarks,
    optimization
  });
  
  return optimalTime;
};
```

---

## 9. DATABASE SCHEMA

### 9.1 Core Tables

**emails table:**
```firebase
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  parent_email_id UUID REFERENCES emails(id), -- For threads
  
  -- Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_plain TEXT,
  
  -- Recipients
  to_addresses JSONB NOT NULL, -- Array of {email, name, contactId}
  cc_addresses JSONB,
  bcc_addresses JSONB,
  from_address TEXT NOT NULL,
  reply_to_address TEXT,
  
  -- Metadata
  message_id TEXT UNIQUE, -- RFC 2822 Message-ID
  thread_id TEXT,
  
  -- Status
  status TEXT NOT NULL, -- draft, scheduled, sending, sent, failed, bounced
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Tracking
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  track_downloads BOOLEAN DEFAULT false,
  
  -- Analytics
  open_count INTEGER DEFAULT 0,
  unique_open_count INTEGER DEFAULT 0,
  first_opened_at TIMESTAMP,
  last_opened_at TIMESTAMP,
  click_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- AI
  ai_generated BOOLEAN DEFAULT false,
  ai_provider TEXT,
  ai_model TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_emails_contact (contact_id),
  INDEX idx_emails_deal (deal_id),
  INDEX idx_emails_user (user_id),
  INDEX idx_emails_status (status),
  INDEX idx_emails_sent_at (sent_at),
  INDEX idx_emails_thread (thread_id)
);
```

**email_attachments table:**
```firebase
CREATE TABLE email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  
  -- File info
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Storage
  storage_path TEXT NOT NULL,
  storage_provider TEXT NOT NULL, -- s3, gcs, local
  url TEXT,
  
  -- Source
  source TEXT NOT NULL, -- upload, crm, dynamic
  source_id TEXT, -- CRM document ID
  
  -- Tracking
  track_downloads BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**email_templates table:**
```firebase
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_plain TEXT,
  
  -- Configuration
  context JSONB, -- {applicableTypes, requiredFields, recommendedFor}
  variables JSONB, -- Array of template variables
  
  -- Access
  visibility TEXT NOT NULL, -- private, team, organization
  shared_with JSONB, -- Array of user/team IDs
  is_system BOOLEAN DEFAULT false,
  
  -- Settings
  settings JSONB, -- {trackOpens, trackClicks, etc}
  
  -- AI
  ai_generated BOOLEAN DEFAULT false,
  ai_provider TEXT,
  can_ai_improve BOOLEAN DEFAULT true,
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  
  -- Analytics
  total_sends INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  avg_open_rate DECIMAL(5,2),
  avg_click_rate DECIMAL(5,2),
  
  -- Version control
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  INDEX idx_templates_org (organization_id),
  INDEX idx_templates_category (category),
  INDEX idx_templates_visibility (visibility)
);
```

**email_tracking table:**
```firebase
CREATE TABLE email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  
  -- Tracking
  tracking_token TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL, -- open, click, download, reply, bounce, unsubscribe
  
  -- Event data
  event_data JSONB, -- {linkUrl, attachmentId, deviceType, etc}
  
  -- Technical details
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  email_client TEXT, -- gmail, outlook, apple_mail, etc
  location JSONB, -- {city, region, country}
  
  -- Timestamp
  tracked_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_tracking_email (email_id),
  INDEX idx_tracking_token (tracking_token),
  INDEX idx_tracking_type (event_type)
);
```

**email_workflows table:**
```firebase
CREATE TABLE email_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  
  -- Configuration
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  
  -- Trigger
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  
  -- Actions
  actions JSONB NOT NULL, -- Array of workflow actions
  
  -- Timing
  timing JSONB, -- {delay, sendAt, skipWeekends, etc}
  
  -- Filters
  filters JSONB,
  
  -- Statistics
  triggered_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_workflows_org (organization_id),
  INDEX idx_workflows_enabled (enabled)
);
```

**ai_usage_logs table:**
```firebase
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Request details
  provider TEXT NOT NULL, -- gemini, openai
  model TEXT NOT NULL,
  feature TEXT NOT NULL, -- generate_email, improve_text, etc
  
  -- Usage
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost DECIMAL(10,4),
  
  -- Context
  email_id UUID REFERENCES emails(id),
  context_type TEXT, -- invoice, quote, deal, etc
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ai_logs_org (organization_id),
  INDEX idx_ai_logs_user (user_id),
  INDEX idx_ai_logs_date (created_at)
);
```

---

## 10. API ENDPOINTS

### 10.1 Email Compose & Send

**POST /api/emails/send**
```typescript
// Send or schedule an email
Request: {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  from: string;
  replyTo?: string;
  subject: string;
  body: string; // HTML
  
  templateId?: string;
  context?: EmailContext;
  
  attachments?: string[]; // Attachment IDs
  
  tracking?: {
    trackOpens: boolean;
    trackClicks: boolean;
    trackDownloads: boolean;
  };
  
  crm?: {
    logToTimeline: boolean;
    createFollowUpTask: boolean;
    followUpDays?: number;
  };
  
  scheduledAt?: string; // ISO timestamp
}

Response: {
  id: string;
  status: 'sent' | 'scheduled';
  messageId?: string;
  scheduledFor?: string;
}
```

**POST /api/emails/draft**
```typescript
// Save email as draft
Request: {
  // Same fields as send, all optional
}

Response: {
  id: string;
  status: 'draft';
  savedAt: string;
}
```

**GET /api/emails/{id}**
```typescript
// Get email details
Response: {
  id: string;
  subject: string;
  body: string;
  to: EmailRecipient[];
  // ... all email fields
  analytics: {
    opens: number;
    clicks: number;
    replies: number;
    // ...
  };
}
```

### 10.2 Templates

**GET /api/templates**
```typescript
// List templates
Query: {
  category?: string;
  visibility?: 'private' | 'team' | 'organization';
  search?: string;
  sortBy?: 'usage' | 'rating' | 'recent';
  limit?: number;
  offset?: number;
}

Response: {
  templates: EmailTemplate[];
  total: number;
  hasMore: boolean;
}
```

**POST /api/templates**
```typescript
// Create template
Request: {
  name: string;
  description?: string;
  category: string;
  subject: string;
  body: string;
  visibility: string;
  context?: TemplateContext;
  settings?: TemplateSettings;
}

Response: {
  id: string;
  template: EmailTemplate;
}
```

**PUT /api/templates/{id}**
```typescript
// Update template
Request: {
  // Same fields as create, all optional
}

Response: {
  template: EmailTemplate;
}
```

**DELETE /api/templates/{id}**
```typescript
// Delete template
Response: {
  success: boolean;
}
```

### 10.3 AI Features

**POST /api/ai/generate-email**
```typescript
Request: {
  provider: 'gemini' | 'openai';
  model: string;
  context: EmailContext;
  preferences: {
    tone: string;
    length: string;
    language: string;
    includeGreeting: boolean;
    includeCTA: boolean;
  };
  customInstruction?: string;
}

Response: {
  subject: string;
  body: string;
  toneAnalysis: string;
  keyPoints: string[];
  suggestedFollowupDays: number;
  tokensUsed: number;
  cost: number;
}
```

**POST /api/ai/improve-text**
```typescript
Request: {
  provider: 'gemini' | 'openai';
  text: string;
  improvementType: 'grammar' | 'professional' | 'concise' | 'detailed';
  targetTone?: string;
}

Response: {
  improvedText: string;
  changes: string[];
  tokensUsed: number;
}
```

**POST /api/ai/generate-subjects**
```typescript
Request: {
  provider: 'gemini' | 'openai';
  emailBody: string;
  context: EmailContext;
  count: number;
}

Response: {
  subjects: Array<{
    subject: string;
    style: string;
    score: number;
    reasoning: string;
  }>;
}
```

**POST /api/ai/analyze-content**
```typescript
Request: {
  subject: string;
  body: string;
}

Response: {
  readability: ReadabilityScore;
  tone: ToneAnalysis;
  deliverability: DeliverabilityScore;
  engagement: EngagementPrediction;
  length: LengthAnalysis;
}
```

### 10.4 Attachments

**POST /api/attachments/upload**
```typescript
// Upload file
Request: FormData with 'file' field

Response: {
  id: string;
  filename: string;
  size: number;
  type: string;
  url: string;
}
```

**GET /api/attachments/crm**
```typescript
// List CRM documents
Query: {
  search?: string;
  type?: string;
  limit?: number;
}

Response: {
  documents: CRMDocument[];
}
```

### 10.5 Analytics & Tracking

**GET /api/emails/{id}/analytics**
```typescript
// Get detailed email analytics
Response: {
  opens: Array<{
    timestamp: string;
    ipAddress: string;
    deviceType: string;
    emailClient: string;
    location: Location;
  }>;
  clicks: Array<{
    timestamp: string;
    linkUrl: string;
    linkText: string;
  }>;
  downloads: Array<{
    timestamp: string;
    filename: string;
  }>;
  // ... more detailed analytics
}
```

**GET /api/templates/{id}/analytics**
```typescript
// Get template performance
Query: {
  dateFrom?: string;
  dateTo?: string;
}

Response: {
  totalSends: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgReplyRate: number;
  timeline: Array<{
    date: string;
    sends: number;
    opens: number;
    clicks: number;
  }>;
  bestSendTimes: Array<{
    day: string;
    hour: number;
    openRate: number;
  }>;
}
```

---

## 11. IMPLEMENTATION ROADMAP

### 11.1 Phase 1: Core Email Compose (Week 1-2) - 8 hours

**Sprint 1.1: Modal Foundation (2h)**
- Create modal component structure
- Implement open/close functionality
- Build recipient input with basic validation
- From/Reply-To address selection
- Subject line input

**Sprint 1.2: Rich Text Editor (3h)**
- Integrate TipTap editor
- Implement toolbar with basic formatting
- Add link insertion
- Add image upload
- Save/load draft functionality

**Sprint 1.3: Basic Features (3h)**
- CC/BCC toggle
- Attachment upload (files only)
- Basic tracking options (checkboxes)
- Send and save draft actions
- Form validation
- Error handling

**Deliverables:**
- Working compose modal
- Send basic emails
- Save drafts
- Attach files

---

### 11.2 Phase 2: Templates System (Week 2-3) - 5 hours

**Sprint 2.1: Template CRUD (2h)**
- Template list view
- Template creation form
- Template editor
- Template deletion
- Category system

**Sprint 2.2: Merge Fields (2h)**
- Define merge field structure
- Merge field picker UI
- Insert merge fields in editor
- Resolve merge fields on send
- Handle missing values

**Sprint 2.3: Template Application (1h)**
- Template selector in compose modal
- Apply template to email
- Pre-built template library (10-15 templates)
- Template usage tracking

**Deliverables:**
- Full template management
- Merge field system
- Pre-built templates
- Template usage in compose

---

### 11.3 Phase 3: AI Integration (Week 3-5) - 10 hours

**Sprint 3.1: AI Provider Setup (2h)**
- Gemini API integration
- OpenAI API integration
- Provider selection UI
- API key management
- Usage tracking setup

**Sprint 3.2: Email Generation (3h)**
- Generate complete email feature
- Build context from CRM data
- Prompt engineering
- Response parsing
- Multiple options UI

**Sprint 3.3: Content Improvement (2h)**
- Improve text feature
- Change tone feature
- Fix grammar feature
- Before/after comparison UI

**Sprint 3.4: Additional AI Features (3h)**
- Subject line generation
- Content analysis
- Smart send time suggestions
- AI usage limits and billing

**Deliverables:**
- Multi-provider AI system
- Email generation
- Content improvement
- Subject generation
- Usage tracking

---

### 11.4 Phase 4: Advanced Features (Week 5-6) - 8 hours

**Sprint 4.1: Attachment Management (2h)**
- CRM document browser
- Dynamic attachments (invoice PDFs)
- Attachment validation
- Multiple file upload
- Progress indicators

**Sprint 4.2: Email Tracking (3h)**
- Implement tracking pixel
- Link click tracking
- Attachment download tracking
- Analytics dashboard
- Real-time notifications

**Sprint 4.3: Scheduling (2h)**
- Schedule send UI
- Cron job for scheduled emails
- Smart send time optimization
- Timezone handling

**Sprint 4.4: CRM Integration (1h)**
- Log emails to timeline
- Auto-create follow-up tasks
- Update deal stages
- Link to related records

**Deliverables:**
- Full attachment system
- Email tracking
- Scheduling
- Deep CRM integration

---

### 11.5 Phase 5: Workflows & Automation (Week 6-7) - 6 hours

**Sprint 5.1: Workflow Engine (3h)**
- Workflow data model
- Trigger system
- Action execution
- Timing/delay handling

**Sprint 5.2: Pre-built Workflows (2h)**
- Invoice follow-up sequence
- Quote follow-up sequence
- Lead nurturing sequence
- No-response follow-up

**Sprint 5.3: Workflow UI (1h)**
- Workflow builder interface
- Workflow list/management
- Workflow analytics
- Enable/disable workflows

**Deliverables:**
- Workflow automation system
- Pre-built workflows
- Workflow management UI

---

### 11.6 Phase 6: Analytics & Optimization (Week 7-8) - 5 hours

**Sprint 6.1: Individual Email Analytics (2h)**
- Email detail view
- Activity timeline
- Link/attachment tracking display
- AI insights

**Sprint 6.2: Aggregate Analytics (2h)**
- Template performance dashboard
- Campaign analytics
- Best send times analysis
- A/B testing framework

**Sprint 6.3: Optimization Features (1h)**
- Deliverability scoring
- Spam score prediction
- Subject line testing
- Send time optimization

**Deliverables:**
- Comprehensive analytics
- Performance insights
- Optimization tools

---

### 11.7 Phase 7: Polish & Production (Week 8) - 5 hours

**Sprint 7.1: Performance (1.5h)**
- Optimize bundle size
- Lazy load components
- Implement caching
- Database query optimization

**Sprint 7.2: Testing (2h)**
- Unit tests for critical paths
- Integration tests
- Email rendering tests
- Cross-client testing (Gmail, Outlook, etc.)

**Sprint 7.3: Documentation (1h)**
- User documentation
- API documentation
- Admin guide
- Video tutorials

**Sprint 7.4: Launch Prep (0.5h)**
- Final bug fixes
- Security audit
- Performance monitoring setup
- User onboarding flow

**Deliverables:**
- Production-ready system
- Complete documentation
- Monitoring and alerts

---

## 12. TECHNICAL CONSIDERATIONS

### 12.1 Performance Optimization

**Frontend:**
- Code splitting for modal (lazy load)
- Debounce autocomplete searches
- Virtual scrolling for large template lists
- Memoize expensive computations
- Optimize re-renders with React.memo

**Backend:**
- Cache frequently used templates
- Batch email sends
- Queue system for email delivery
- CDN for attachments
- Database indexing on common queries

### 12.2 Security

**Email Security:**
- SPF, DKIM, DMARC configuration
- Rate limiting to prevent spam
- Sanitize HTML content
- Validate attachments for malware
- Encrypt sensitive data

**API Security:**
- JWT authentication
- API rate limiting
- Input validation and sanitization
- firebase injection prevention
- XSS protection

**Privacy:**
- GDPR compliance
- Unsubscribe mechanism
- Data retention policies
- Secure tracking tokens
- Anonymize IP addresses (optional)

### 12.3 Scalability

**Email Delivery:**
- Use transactional email service (SendGrid, AWS SES, Postmark)
- Queue system (Redis, RabbitMQ)
- Retry mechanism for failed sends
- Bounce handling
- Webhook processing for status updates

**Storage:**
- S3/GCS for attachments
- CDN for static files
- Database connection pooling
- Read replicas for analytics

### 12.4 Monitoring & Alerts

**Metrics to Track:**
- Email send success rate
- Delivery rate
- Bounce rate
- API response times
- AI token usage and costs
- Queue depth
- Error rates

**Alerts:**
- High bounce rate
- Send failures
- API errors
- Queue backlog
- AI budget exceeded
- Unusual activity

### 12.5 Compliance

**Email Regulations:**
- CAN-SPAM Act compliance
- GDPR compliance
- CCPA compliance
- Unsubscribe links in marketing emails
- Physical address in footer
- Sender identification

**Data Handling:**
- Secure storage of email content
- Data retention policies
- Right to deletion
- Data export capabilities
- Audit logging

---

## 13. SUCCESS METRICS

### 13.1 Product Metrics

**Adoption:**
- % of users who have sent an email
- Average emails sent per user per week
- Template usage rate
- AI feature adoption rate

**Engagement:**
- Email open rates
- Click-through rates
- Reply rates
- Template rating scores

**Efficiency:**
- Time to compose email (with vs without AI)
- Template reuse rate
- Automation usage
- Scheduled email usage

### 13.2 Business Metrics

**Revenue Impact:**
- Faster payment collection (invoice emails)
- Higher quote acceptance rates
- Increased deal velocity
- Customer retention

**User Satisfaction:**
- NPS score
- Feature satisfaction ratings
- Support ticket volume
- User feedback sentiment

### 13.3 Technical Metrics

**Performance:**
- Modal load time < 500ms
- Email send time < 2s
- AI generation time < 5s
- 99.9% uptime

**Quality:**
- Email delivery rate > 98%
- Bounce rate < 2%
- Error rate < 0.1%
- Zero security incidents

---

## 14. FUTURE ENHANCEMENTS (No need Now)

### 14.1 Short-term (3-6 months)

**Email Features:**
- Email sequences (drip campaigns)
- Conditional logic in workflows
- Dynamic content blocks
- Personalization at scale
- Email A/B testing

**AI Enhancements:**
- Multi-language support
- Sentiment analysis on replies
- Auto-categorize incoming emails
- Predictive response suggestions
- Voice-to-email dictation

**Integrations:**
- Calendar integration for meeting scheduling
- E-signature integration
- SMS fallback
- Social media messaging
- WhatsApp Business

### 14.2 Long-term (6-12 months)

**Advanced Features:**
- Conversational AI for email threads
- Video email messages
- Interactive emails (forms, surveys)
- Email collaboration (team comments)
- Advanced personalization engine

**Analytics:**
- Predictive analytics (likelihood to respond)
- Revenue attribution
- Email engagement scoring
- Competitive intelligence
- Market insights from email data

**Platform:**
- Mobile app optimization
- Offline mode
- Voice commands
- Browser extension
- API for third-party integrations

---

## 15. CONCLUSION & NEXT STEPS

### 15.1 Implementation Priority

**Must Have (MVP):**
✅ Compose modal with rich text editor
✅ Send and save drafts
✅ Basic template system
✅ Merge fields
✅ File attachments
✅ Basic AI generation (one provider)
✅ Email tracking
✅ CRM integration

**Should Have (V1.1):**
- Full AI feature set (both providers)
- Template analytics
- Schedule send
- Workflow automation
- Advanced attachments

**Nice to Have (V2.0):**
- A/B testing
- Advanced workflows
- Multi-language
- Mobile optimization

### 15.2 Getting Started

**Week 1 Actions:**
1. Set up project structure and dependencies
2. Create database schema
3. Build modal foundation
4. Implement basic rich text editor
5. Set up API endpoints

**Key Dependencies:**
- Choose transactional email provider
- Set up AI provider accounts (Gemini + OpenAI)
- Configure file storage (S3/GCS)
- Set up tracking infrastructure

**Team Requirements:**
- 1-2 Frontend developers
- 1 Backend developer
- 1 DevOps engineer (part-time)
- 1 Product manager
- QA support

### 15.3 Risk Mitigation

**Technical Risks:**
- Email deliverability issues → Use reputable ESP, proper authentication
- AI costs exceed budget → Implement usage limits, caching, fallbacks
- Performance issues → Load testing, optimization, caching strategy

**Product Risks:**
- Low adoption → User onboarding, training, templates
- Poor email quality → Pre-built templates, AI quality checks
- Spam complaints → Clear opt-out, compliance checks

### 15.4 Documentation Requirements

**For Developers:**
- API documentation (Swagger/OpenAPI)
- Component documentation (Storybook)
- Database schema documentation
- Deployment guide
- Troubleshooting guide

**For Users:**
- Getting started guide
- Video tutorials
- Template best practices
- AI feature guides
- FAQ and troubleshooting

**For Administrators:**
- Configuration guide
- Analytics interpretation
- Workflow setup guide
- Compliance guidelines
- Security best practices

---

**END OF SPECIFICATION**

This comprehensive specification provides everything needed to build a full-featured email compose modal with templates and AI integration for your CRM system. The implementation is broken down into manageable sprints with clear deliverables and timelines.
