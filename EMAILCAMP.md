EMAIL CAMPAIGNS - ENTERPRISE EMAIL MARKETING SYSTEM

OVERVIEW

An enterprise-grade email campaign management system with AI-powered content creation, advanced automation, drag-and-drop builder, and comprehensive analytics. Seamlessly integrates with existing CRM leads for powerful segmentation and targeting.

Core Principle: Create, Send, Track, Optimize - All in one intelligent platform

User Flow: Select Audience → Build Email → Setup Automation → Send → Analyze

TECH STACK

OpenAI GPT-4o - AI content generation, email copy writing

React Email / MJML - Email template rendering

Email Service Provider - SendGrid/AWS SES/Mailgun

Queue System - Bull/Redis for email processing

Next.js API Routes - Backend processing

Database - marketing/email-campaigns collection

Existing CRM - Integration with leads section

COMPLETE WORKFLOW - STEP BY STEP

STEP 1: CAMPAIGNS DASHBOARD

Page: /marketing/email-campaigns

Breadcrumb: Marketing AI > Email Campaigns

Dashboard Layout:

Header Section:

📧 Email Campaigns

[+ Create Campaign] [📋 Templates] [👥 Audiences] [⚙️ Settings]


Campaign Stats Overview:

┌─────────────────────────────────────────────────┐
│ 📊 Campaign Performance (Last 30 Days)          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Sent: 45,230  |  Opens: 42.3%  |  Clicks: 8.7% │
│  Bounces: 1.2% |  Unsubs: 0.3%  |  Conv: 3.2%   │
│                                                 │
└─────────────────────────────────────────────────┘


Campaign List (Tabs):

[All] [Draft] [Scheduled] [Sent] [Archived]

┌────────────────────────────────────────────────┐
│ 📧 Q1 Product Launch Email                    │
│ Status: Sent | Sent to: 5,234 contacts        │
│ Sent: Jan 15, 2025 | Opens: 48.2% | Clicks: 9.3% │
│ [View Report] [Clone] [Archive]               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 📧 Weekly Newsletter #42                       │
│ Status: Scheduled | Recipients: 12,450         │
│ Scheduled: Jan 20, 2025 10:00 AM              │
│ [Edit] [View] [Cancel]                        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 📧 Welcome Email Series (Automation)           │
│ Status: Active | Subscribers: 1,234            │
│ Triggered: 145 times this month                │
│ [Manage] [View Stats] [Pause]                 │
└────────────────────────────────────────────────┘


Quick Actions Sidebar:

🚀 Quick Create:
  • One-Time Campaign
  • Automated Workflow
  • A/B Test Campaign

📊 Recent Activity:
  • Campaign sent: 2 hours ago
  • 234 new opens today
  • 45 new clicks today

🔔 Alerts:
  • High bounce rate on "Promo 2024"
  • 3 campaigns awaiting approval


Actions:

Click "Create Campaign" → Triggers Step 2

Click campaign → View details/edit

Click "Templates" → Template gallery

STEP 2: CREATE NEW CAMPAIGN

Page: /marketing/email-campaigns/new

Breadcrumb: Marketing AI > Email Campaigns > New Campaign

Campaign Type Selection:

Choose Campaign Type:

┌─────────────────────────┐  ┌─────────────────────────┐
│ 📧 One-Time Campaign    │  │ 🔄 Automated Workflow   │
│                         │  │                         │
│ Send email once to      │  │ Drip campaigns,         │
│ selected audience       │  │ welcome series, etc.    │
│                         │  │                         │
│ [Select]                │  │ [Select]                │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│ 🧪 A/B Test Campaign    │  │ 📅 Recurring Campaign   │
│                         │  │                         │
│ Test subject lines,     │  │ Schedule weekly or      │
│ content variations      │  │ monthly sends           │
│                         │  │                         │
│ [Select]                │  │ [Select]                │
└─────────────────────────┘  └─────────────────────────┘


After selection, proceed to configuration:

SECTION 1: Campaign Details

1.1 Campaign Name (Required)

Text input: e.g., "Q1 Product Launch"

Internal name (not shown to recipients)

Character limit: 100 characters

1.2 Campaign Description (Optional)

Textarea: Brief description for internal tracking

Character limit: 200 characters

1.3 Folder/Category

Dropdown: Select folder or create new

Options: Newsletters, Promotions, Announcements, Onboarding, etc.

SECTION 2: Email Basics

2.1 From Details

From Name: Text input (default: Company name)

From Email: Dropdown (verified sender addresses)

Reply-to Email: Text input (default: same as from)

2.2 Subject Line

Text input: e.g., "Introducing Our New Product 🚀"

Character count: 0/100 (recommended: 40-60)

🤖 [Generate with AI] button

Preview: How it looks in inbox

2.3 Preview Text

Text input: First line shown in inbox preview

Character count: 0/140

🤖 [Generate with AI] button

SECTION 3: Audience Selection

3.1 Select Recipients

Option A: Use Existing Audience/List

┌─────────────────────────────────┐
│ 📋 Select from Lists            │
│                                 │
│ □ All Contacts (12,450)         │
│ □ Newsletter Subscribers (8,234)│
│ □ VIP Customers (1,456)         │
│ □ Trial Users (3,890)           │
│ □ Inactive Users (2,100)        │
│                                 │
│ [Manage Lists]                  │
└─────────────────────────────────┘


Option B: Import from CRM Leads

┌─────────────────────────────────┐
│ 👥 Import from CRM              │
│                                 │
│ [Import All Leads]              │
│ [Import by Status]              │
│ [Import by Tag]                 │
│ [Custom Filter]                 │
│                                 │
│ Preview: 5,234 contacts         │
└─────────────────────────────────┘


Option C: Create Segment (Advanced)

┌─────────────────────────────────┐
│ 🎯 Build Segment                │
│                                 │
│ Contacts who match:             │
│ [All ▼] of the following:       │
│                                 │
│ + Email Activity               │
│   Opened any campaign          │
│   in the last [30] days        │
│                                 │
│ + Contact Info                 │
│   Location is [Brisbane]       │
│                                 │
│ + Engagement                   │
│   Click count > [3]            │
│                                 │
│ [+ Add Condition]              │
│                                 │
│ Estimated audience: ~2,450     │
└─────────────────────────────────┘


Option D: Manual Email Entry

┌─────────────────────────────────┐
│ ✍️ Add Emails Manually          │
│                                 │
│ Paste or type email addresses: │
│ (one per line)                  │
│                                 │
│ [Textarea]                      │
│                                 │
│ [Import from CSV]               │
└─────────────────────────────────┘


3.2 Exclusions (Optional)

Exclude these contacts:
□ Unsubscribed contacts (automatically excluded)
□ Bounced emails (automatically excluded)
□ Specific list: [Select list ▼]
□ Contacts who received campaign: [Select ▼]


3.3 List Management Options

□ Save this audience as static list
  Name: [Text input]

□ Automatically remove bounced emails
□ Remove unsubscribes from all lists


Summary Panel (Sticky Right Side):

📧 Campaign Preview

Name: Q1 Product Launch
Type: One-Time Campaign
Folder: Promotions

From: Company Name
Subject: (not set)

Recipients: 2,450 contacts
Estimated send time: ~5 minutes

[Continue to Email Builder →]


Actions:

"Save as Draft" → Save and return to dashboard

"Continue" → Proceed to Step 3 (Email Builder)

STEP 3: EMAIL CONTENT CREATION

Page: /marketing/email-campaigns/[campaignId]/build

Breadcrumb: Marketing AI > Email Campaigns > [Campaign Name] > Build

Content Creation Options:

HEADER:

📧 Build Your Email

[← Back to Campaign Setup]

[🤖 AI Email Builder] [🎨 Template Gallery] [✍️ Start from Scratch]


OPTION A: AI Email Builder (Recommended)

Step 3A-1: AI Content Generation

🤖 AI Email Content Generator

Tell AI what you want to write about:

Campaign Goal:
⚪ Promote Product/Service
⚪ Share News/Update
⚪ Nurture Leads
⚪ Drive Event Registration
⚪ Request Feedback

Main Message (Required):
[Textarea: Describe what you want to communicate]
Example: "Announce our new AI-powered marketing platform 
with 30% launch discount for early adopters"

Target Audience:
[Text input: Who is this email for?]
Example: "Small business owners, marketers, agency owners"

Tone:
⚪ Professional
⚪ Friendly & Casual
⚪ Urgent & Direct
⚪ Formal & Corporate

Email Length:
⚪ Short & Sweet (100-200 words)
⚪ Standard (200-400 words)
⚪ Detailed (400-600 words)

Include:
□ Compelling subject line
□ Clear CTA button
□ Social proof / testimonials
□ Product benefits
□ Urgency / scarcity
□ Personalization merge tags

[Generate Email Content 🚀]


Step 3A-2: AI Generated Content Preview

✨ AI Generated Email Content

Subject Line Options (select one):
⚪ "Transform Your Marketing with AI - 30% Off Launch Special"
⚪ "New: AI Marketing Platform (Limited Time: 30% Discount)"
⚪ "Get 30% Off Our Revolutionary AI Marketing Tool"

Preview Text:
"Join early adopters and save 30% on the future of marketing automation"

Email Body:
[Preview of generated content with formatting]

Hi {{FirstName}},

We're excited to introduce [Product Name], an AI-powered 
marketing platform designed specifically for [audience]...

[Continue preview...]

CTA Button Text: "Get 30% Off Now"

[Edit Content] [Regenerate] [Use This Content →]


Step 3A-3: AI Content Editor (Before Template)

✏️ Refine Your Content

[Show side-by-side: Original | Edited]

AI Editing Tools:
[Improve Clarity] [Make More Persuasive] [Shorten]
[Add Urgency] [Add Social Proof] [Simplify Language]

Subject Line:
[Editable text input with AI suggestions]

Preview Text:
[Editable text input]

Body Content:
[Rich text editor with AI assistance]
- Inline AI suggestions
- Tone adjustment
- Grammar and spelling check
- Readability score: 72 (Good)

[Continue to Template Builder →]


OPTION B: Template Gallery

📋 Choose a Template

[Filter: All | Newsletter | Promotion | Announcement | Custom]

┌──────────────────────┐  ┌──────────────────────┐
│ [Template Preview]   │  │ [Template Preview]   │
│                      │  │                      │
│ Modern Newsletter    │  │ Product Launch       │
│                      │  │                      │
│ [Use Template]       │  │ [Use Template]       │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ [Template Preview]   │  │ [Template Preview]   │
│                      │  │                      │
│ Welcome Email        │  │ Re-engagement        │
│                      │  │                      │
│ [Use Template]       │  │ [Use Template]       │
└──────────────────────┘  └──────────────────────┘


OPTION C: Drag-and-Drop Email Builder

Interface: Split screen (60% canvas / 40% elements)

Left Panel: Building Blocks

📦 Content Blocks:

Structure:
  [📄 Text Block]
  [🖼️ Image Block]
  [🔘 Button Block]
  [➗ Divider]
  [🔲 2 Columns]
  [🔳 3 Columns]

Components:
  [📰 Header]
  [🦶 Footer]
  [📱 Social Icons]
  [🎬 Video Embed]
  [⭐ Product Card]
  [💬 Testimonial]
  [📊 Stats Counter]

Saved Blocks:
  [Your custom saved blocks]


Center Panel: Email Canvas

┌────────────────────────────────┐
│ [Logo/Header Section]          │
├────────────────────────────────┤
│                                │
│ [Drag blocks here]             │
│                                │
│ Main Content Area              │
│                                │
│ [Drop zones highlighted        │
│  when dragging]                │
│                                │
├────────────────────────────────┤
│ [Footer Section]               │
│ [Unsubscribe Link]             │
└────────────────────────────────┘

[Desktop 💻] [Mobile 📱] [HTML View 💻]


Right Panel: Block Settings

When a block is selected:

⚙️ Block Settings

Text Block:
  
  Content:
  [Rich text editor]
  - Bold, Italic, Underline
  - Font size, color
  - Alignment
  - Links
  - Merge tags: {{FirstName}}
  
  Styling:
  - Background color: [picker]
  - Padding: [sliders]
  - Border: [settings]
  
  [Save Block]
  [Delete Block]


Top Toolbar:

[← Back] [💾 Save] [👁️ Preview] [📱 Test Send] [✅ Continue →]

Undo: [↶] Redo: [↷]

Zoom: [100% ▼]

Device: [💻 Desktop] [📱 Mobile]


Email Preview Modal:

Click "Preview" button:

┌──────────────────────────────────────┐
│ 📧 Email Preview                     │
├──────────────────────────────────────┤
│                                      │
│ [Desktop View]  [Mobile View]        │
│                                      │
│ ┌────────────────────────────┐      │
│ │                            │      │
│ │ [Rendered email content]   │      │
│ │                            │      │
│ │ Shows actual appearance    │      │
│ │ with all styling          │      │
│ │                            │      │
│ └────────────────────────────┘      │
│                                      │
│ Personalization Preview:             │
│ View as: [John Doe ▼]               │
│                                      │
│ [Send Test Email] [Close]           │
└──────────────────────────────────────┘


Brand Style Enforcement:

🎨 Brand Guidelines Applied

✓ Logo: company-logo.png
✓ Primary Color: #0066CC
✓ Secondary Color: #00CC66
✓ Font: Open Sans, Arial, sans-serif
✓ Button Style: Rounded, 48px height

[Edit Brand Settings]


Actions:

"Save" → Save email content as draft

"Preview" → Show email preview (desktop/mobile)

"Test Send" → Send test to specified email

"Continue" → Proceed to Step 4 (Automation/Schedule)

STEP 4: AUTOMATION & WORKFLOW SETUP

Page: /marketing/email-campaigns/[campaignId]/automation

Breadcrumb: Marketing AI > Email Campaigns > [Campaign Name] > Automation

Campaign Type: ONE-TIME CAMPAIGN

Simple Send Configuration:

📅 Schedule Your Campaign

Send Options:
⚪ Send immediately after approval
⚪ Schedule for specific date/time
⚪ Send as draft (manual send later)

If Scheduled:
  Date: [Jan 25, 2025 ▼]
  Time: [10:00 AM ▼]
  Timezone: [Brisbane/Australia ▼]
  
  □ Optimize send time per recipient
    (AI determines best time based on past opens)

Sending Settings:
  Throttling: [1000 ▼] emails per hour
  (Prevents overwhelming your sending infrastructure)
  
  Retry Logic:
  □ Retry failed sends (max 3 attempts)
  □ Skip bounced emails automatically

[Continue to Review →]


Campaign Type: AUTOMATED WORKFLOW

Workflow Builder Interface:

🔄 Build Your Email Automation

Trigger:
┌─────────────────────────────────┐
│ When should this workflow start?│
│                                 │
│ ⚪ Contact subscribes to list   │
│ ⚪ Contact added to CRM         │
│ ⚪ Contact clicks link          │
│ ⚪ Contact opens email          │
│ ⚪ Contact field changes        │
│ ⚪ Date-based (birthday, etc.)  │
│ ⚪ Inactivity (no opens for X)  │
│                                 │
│ [Configure Trigger]             │
└─────────────────────────────────┘


Visual Workflow Canvas:

Start: Contact Subscribes
       ↓
┌──────────────────┐
│ Wait 5 minutes   │  [Edit Delay]
└──────────────────┘
       ↓
┌──────────────────┐
│ Send Email 1:    │  [Edit Email]
│ Welcome Email    │
└──────────────────┘
       ↓
┌──────────────────┐
│ Wait 2 days      │  [Edit Delay]
└──────────────────┘
       ↓
┌──────────────────┐
│ Condition:       │  [Edit Condition]
│ Opened Email 1?  │
└──────────────────┘
     ↙         ↘
  Yes           No
   ↓             ↓
[Send Email 2] [Send Reminder]
   ↓             ↓


Add Workflow Step:

[+ Add Step]

Choose Action:
  📧 Send Email
  ⏰ Wait/Delay
  🔀 If/Else Condition
  🏷️ Add/Remove Tag
  📋 Add to List
  🚫 End Workflow
  🔗 Trigger Webhook


Delay Configuration:

⏰ Wait/Delay Settings

Wait for:
  [2] [Days ▼]

Options:
⚪ Wait exact duration
⚪ Wait until specific time
   Time: [9:00 AM ▼]
   (Sends at 9 AM in recipient's timezone)

⚪ Wait until day of week
   Day: [Monday ▼]

□ Skip weekends
□ Skip holidays

[Save]


Condition Configuration:

🔀 If/Else Condition

Check if contact:
⚪ Opened any email in this workflow
⚪ Clicked link in specific email
⚪ Has tag: [Select tag ▼]
⚪ Field value equals: [Field ▼] [Value]
⚪ Custom formula

Then:
  → Path A (Yes branch)

Else:
  → Path B (No branch)

[Save Condition]


Workflow Settings:

⚙️ Automation Settings

Enrollment:
□ Allow contacts to enter multiple times
□ Re-enter if they meet trigger again
  Wait [30] days between enrollments

Exit Rules:
□ Exit if unsubscribes
□ Exit if achieves goal: [Select goal ▼]
□ Exit if contact is added to list: [Select ▼]

Sending Limits:
Max emails per contact: [10 ▼]
Throttle: [500 ▼] per hour

[Save Settings]


Actions:

"Save Workflow" → Save as draft

"Test Workflow" → Send test run

"Activate" → Make workflow live

STEP 5: REVIEW & SEND

Page: /marketing/email-campaigns/[campaignId]/review

Breadcrumb: Marketing AI > Email Campaigns > [Campaign Name] > Review & Send

Pre-Send Checklist:

✅ Campaign Review

Campaign Details:
  ✓ Name: Q1 Product Launch
  ✓ Type: One-Time Campaign
  ✓ Folder: Promotions

Email Content:
  ✓ Subject: "Transform Your Marketing with AI - 30% Off"
  ✓ Preview Text: Set
  ✓ From: Company Name <hello@company.com>
  ✓ Reply-to: support@company.com
  ✓ Content: Complete
  ✓ Mobile-responsive: Yes
  ✓ Spam score: 2/10 (Excellent)

Audience:
  ✓ Recipients: 2,450 contacts
  ✓ Lists: Newsletter Subscribers, VIP Customers
  ✓ Exclusions: 45 unsubscribed, 12 bounced

Sending:
  ✓ Schedule: Jan 25, 2025 at 10:00 AM
  ✓ Throttling: 1,000/hour
  ✓ Retry logic: Enabled

Compliance:
  ✓ Unsubscribe link: Present
  ✓ Physical address: Present
  ✓ CAN-SPAM compliant: Yes
  ✓ GDPR compliant: Yes

Tracking:
  ✓ Open tracking: Enabled
  ✓ Click tracking: Enabled
  ✓ Conversion tracking: Configured


Email Preview:

[Desktop View] [Mobile View]

┌────────────────────────────────┐
│                                │
│ [Final email preview]          │
│                                │
│ Shows exactly how it will look │
│ in recipient's inbox           │
│                                │
└────────────────────────────────┘

[Send Test Email to: ]
[your@email.com] [Send Test]


Approval Workflow (if enabled):

📋 Approval Required

This campaign requires approval before sending.

Approvers:
  • John Doe (Marketing Manager) - Pending
  • Jane Smith (Director) - Pending

Request approval now?

[Request Approval] [Save as Draft]

Once approved, campaign will send at scheduled time.


Final Actions:

[← Back to Edit] [Save as Draft] [Schedule Send ✓]

If immediate send:
[Send Now] button (big, primary)


Confirmation Modal:

┌────────────────────────────────────┐
│ Confirm Send                       │
├────────────────────────────────────┤
│                                    │
│ You're about to send this campaign │
│ to 2,450 contacts.                 │
│                                    │
│ This action cannot be undone.      │
│                                    │
│ [Cancel] [Confirm & Send]          │
└────────────────────────────────────┘


STEP 6: CAMPAIGN ANALYTICS & TRACKING

Page: /marketing/email-campaigns/[campaignId]/analytics

Breadcrumb: Marketing AI > Email Campaigns > [Campaign Name] > Analytics

Analytics Dashboard:

Overview Stats:

📊 Campaign Performance

Sent: Jan 25, 2025 at 10:00 AM
Status: Completed

┌────────────────┬────────────────┬────────────────┐
│ Delivered      │ Opens          │ Clicks         │
│ 2,438 (99.5%)  │ 1,027 (42.1%)  │ 213 (8.7%)     │
└────────────────┴────────────────┴────────────────┘

┌────────────────┬────────────────┬────────────────┐
│ Bounces        │ Unsubscribes   │ Spam Reports   │
│ 12 (0.5%)      │ 7 (0.3%)       │ 2 (0.1%)       │
└────────────────┴────────────────┴────────────────┘


Performance Over Time (Chart):

Opens & Clicks Timeline

[Line chart showing opens and clicks over 24 hours/7 days]

Y-axis: Count
X-axis: Time

- Blue line: Opens
- Green line: Clicks


Click Heatmap:

🔗 Click Activity

Email Content with click heatmap overlay:

[Visual representation of email with highlighted links]

Link Performance:
1. "Get 30% Off Now" (CTA Button) - 156 clicks (73.2%)
2. "Learn More" (Header) - 35 clicks (16.4%)
3. "View Features" (Body link) - 22 clicks (10.3%)

[Export Click Data]


Engagement Breakdown:

📈 Engagement Details

Open Rate: 42.1% (Industry avg: 21.3%) ✓
Click Rate: 8.7% (Industry avg: 2.6%) ✓
Click-to-Open Rate: 20.7%

Device Breakdown:
  Desktop: 58% (596 opens)
  Mobile: 38% (390 opens)
  Tablet: 4% (41 opens)

Email Clients:
  Gmail: 45%
  Outlook: 28%
  Apple Mail: 18%
  Other: 9%

Geographic Performance:
  Brisbane: 38% open rate
  Sydney: 44% open rate
  Melbourne: 41% open rate
  Other: 40% open rate


Conversion Tracking:

🎯 Goal Completions

Primary Goal: Purchase
  Conversions: 78 (3.2% of delivered)
  Revenue: $23,400
  ROI: 1,170%

Secondary Goals:
  Sign-ups: 145
  Downloads: 89
  Form submissions: 56


List Quality Metrics:

📋 List Health

Engagement Quality:
  Highly engaged (3+ opens): 456 (18.7%)
  Moderately engaged (1-2 opens): 571 (23.4%)
  Low engagement (0 opens): 1,411 (57.9%)

Bounces:
  Hard bounces: 8 (removed from list)
  Soft bounces: 4 (will retry)

Unsubscribes:
  Immediate (within 1 hour): 3
  Within 24 hours: 4
  Reason: "Too many emails" (most common)

[Clean List] [Export Engaged Contacts]


A/B Test Results (if applicable):

🧪 A/B Test Performance

Variant A (50% - 1,219 sent)
  Subject: "Transform Your Marketing with AI..."
  Open Rate: 44.2%
  Click Rate: 9.1%
  Winner: ✓

Variant B (50% - 1,219 sent)
  Subject: "New: AI Marketing Platform..."
  Open Rate: 40.0%
  Click Rate: 8.3%

Winner sent to remaining: [N/A - two variants only]


Export & Actions:

[📥 Export Report (PDF/CSV)]
[📧 Email Report to Team]
[📋 Clone Campaign]
[🔄 Create Follow-up]


STEP 7: AUDIENCE MANAGEMENT

Page: /marketing/email-campaigns/audiences

Breadcrumb: Marketing AI > Email Campaigns > Audiences

Audience Dashboard:

Lists Overview:

👥 Email Lists & Audiences

[+ Create New List] [Import from CRM] [Manage Segments]

┌────────────────────────────────────────────┐
│ 📋 All Contacts                            │
│ 12,450 contacts | Last updated: Today      │
│ [View] [Export] [Clean]                    │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 📬 Newsletter Subscribers                  │
│ 8,234 contacts | Growth: +45 this week     │
│ [View] [Export] [Edit]                     │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ⭐ VIP Customers                           │
│ 1,456 contacts | Engagement: 68% avg       │
│ [View] [Export] [Edit]                     │
└────────────────────────────────────────────┘


Create New List:

📋 Create Email List

List Name:
[Text input]

List Type:
⚪ Static List (manually managed)
⚪ Dynamic Segment (auto-updates based on rules)

If Static:
  Add contacts:
  ⚪ Import from CSV
  ⚪ Import from CRM
  ⚪ Select from existing contacts
  ⚪ Enter emails manually

If Dynamic:
  Segment Rules:
  [Advanced Builder]

  Contacts who match [ALL] of the following:
  ┌──────────────────────────────────────────────┐
  │ • Lead Status (CRM) is [Qualified]           │
  │ • Location is [Australia]                    │
  │ • Last Email Open was in [Last 30 Days]      │
  │                                              │
  │ [+ Add Condition]                            │
  └──────────────────────────────────────────────┘

[Save Segment]


CRM Integration (Leads Sync):

Since you have an existing CRM, this module directly queries that collection.

🔄 CRM Leads Integration

Source: CRM / Leads Collection
Total Leads: 15,420

Sync Settings:
⚪ Real-time sync (Fetch on send)
⚪ Daily sync (Update every 24h)

Field Mapping:
  Email Address ⟷ crm.email
  First Name    ⟷ crm.first_name
  Company       ⟷ crm.company_name
  Tags          ⟷ crm.tags

[Test Connection] [Update Mapping]


Static List Management:

As requested, static lists are saved separately from dynamic CRM segments.

📂 Static Lists (Manual & Imports)

Actions:
[+ Create New Static List]

Import Options for this List:
1. Manual Entry:
   [Text Area: Paste emails, one per line]
   
2. CSV Upload:
   [Drag & drop CSV file]

3. Select from CRM:
   [Search CRM Leads] -> [Add to Static List]

Storage: Saved in `marketing/static-lists` collection.


STEP 8: TEMPLATE MANAGEMENT & BRANDING

Page: /marketing/email-campaigns/templates

Breadcrumb: Marketing AI > Email Campaigns > Templates

Accessible directly from the Main Dashboard as requested.

Template Library Interface:

🎨 Email Templates & Assets

Tabs: [My Templates] [System Gallery] [Brand Assets] [AI Generator]

**1. My Templates (Saved):**
┌──────────────────────┐  ┌──────────────────────┐
│ [Preview Thumbnail]  │  │ [Preview Thumbnail]  │
│                      │  │                      │
│ Q1 Newsletter Base   │  │ Black Friday Layout  │
│ [Edit] [Clone]       │  │ [Edit] [Clone]       │
└──────────────────────┘  └──────────────────────┘

**2. Create New Template:**
[+ Blank Canvas] 
[+ Create with AI] -> (Launches AI Content Editor before building)

**3. Brand Assets (Style Enforcement):**
Enforce these styles across all templates:

Logo:
  [upload-logo.png] (Max-width: 200px)

Colors:
  Primary:   [#0066CC] (Buttons, Headers)
  Secondary: [#F0F0F0] (Backgrounds)
  Text:      [#333333]
  
Fonts:
  Header: [Inter, sans-serif]
  Body:   [Roboto, sans-serif]

Social Links:
  [LinkedIn URL] [Twitter URL] [Instagram URL]

Footer Content:
  [Address] [Unsubscribe Text]

[Save Brand Guidelines]


STEP 9: SECURITY & ACCESS CONTROL

Page: /settings/marketing/permissions

Role-Based Access Control (RBAC):

To ensure security for enterprise usage, specific roles limit who can send emails versus who can only draft them.

🛡️ Security Permissions

User Roles:

1. Marketing Admin:
   - Full access to all settings
   - Can approve and send campaigns
   - Can manage integrations

2. Content Creator:
   - Can create and edit campaigns/templates
   - Can draft emails
   - CANNOT send (Must request approval)
   - View-only analytics

3. Analyst:
   - View-only access to campaigns and analytics
   - Cannot edit content or lists

Audit Log:
┌────────────────────────────────────────────────────────┐
│ 🕒 10:45 AM - User 'Sarah' exported "VIP List" CSV     │
│ 🕒 09:30 AM - User 'Mike' changed Brand Colors         │
│ 🕒 Yesterday - User 'Admin' approved "Q1 Launch"       │
└────────────────────────────────────────────────────────┘


Approval Workflow Implementation:

If a user with "Content Creator" role tries to send:

Action: User clicks "Schedule Send".

System: Blocks immediate send. Changes status to Pending Approval.

Notification: System emails "Marketing Admin" alert.

Admin Action: Admin reviews preview -> Clicks [Approve & Schedule] or [Reject with Comments].

STEP 10: INFRASTRUCTURE & SCALABILITY

10.1 Sending Infrastructure

Tech: Next.js API Routes + BullMQ (Redis) + AWS SES / SendGrid

⚙️ Sending Configuration

Provider: [AWS SES ▼]
API Key: ************

Rate Limiting (Throttling):
Target Speed: [2000] emails / hour
(Adjust based on your domain reputation)

Warm-up Mode:
□ Enable automated IP warm-up
  (Gradually increases daily send volume)


10.2 Queue Management (Backend Logic)

To handle high-volume sending without crashing the server:

Job Creation: When "Send" is clicked, the backend does not send emails immediately. It creates a job for every recipient.

Queue Processor:

Redis List holds the queue.

Workers process jobs in batches (e.g., 50 concurrent jobs).

Respects the "Throttling" limit set in settings.

Retry Logic:

If ESP (SendGrid) returns 5xx error -> Retry in 5 mins.

Max retries: 3.

If failed 3 times -> Mark as "Bounced/Failed".

10.3 Data Hygiene & Deduplication

Duplicate Check:
Before queuing, system checks specific campaign ID against recipient list.
Rule: A single email address cannot exist twice in the to field of the same campaign job.

Unsubscribe Handling:

Global Unsubscribe: Check do_not_contact collection.

List Unsubscribe: Check specific list removal.

Headers: Automatically inject List-Unsubscribe headers (RFC 8058) for one-click unsubscribe support (crucial for Gmail/Yahoo deliverability).

TECHNICAL SUMMARY

Database Schema Additions:

campaigns: Stores content, subject, status, schedule time.

lists: Stores static lists metadata.

list_members: Stores relation between static lists and emails.

campaign_analytics: Time-series data for opens/clicks.

brand_settings: Stores global styles (logo, hex codes).

Next.js API Endpoints:

POST /api/marketing/campaigns: Create draft.

POST /api/marketing/campaigns/:id/send: Trigger BullMQ job.

GET /api/marketing/audiences/crm-sync: Fetch/Sync leads from CRM.

POST /api/marketing/templates/generate: Call OpenAI for content.

POST /api/webhooks/email-events: Receive SendGrid/SES webhooks (opens, clicks).