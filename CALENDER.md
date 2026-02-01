CALENDAR - AI-POWERED PLANNING CALENDAR

OVERVIEW

A smart, AI-powered planning calendar that helps any business plan daily, weekly, or monthly work — instantly. Create multiple calendars for different purposes, generate plans with AI assistance, and manage everything in one flexible system.

Core Principle: Calendar = Container, Plan = Item, AI = Assistant

User Flow: Select time → Ask AI → Review → Apply → Execute

TECH STACK

OpenAI GPT-4o - AI plan generation, suggestions

Next.js API Routes - Backend processing

Database - marketing/calendar collection (Firestore/Postgres)

Calendar UI Library - Full Calendar or custom React component

Drag & Drop - React DnD or similar

COMPLETE WORKFLOW - STEP BY STEP

STEP 1: CALENDAR DASHBOARD & SELECTION

Page: /marketing/calendar

Breadcrumb: Marketing AI > Calendar

Dashboard Layout:

Header Section:

📅 My Calendars

[+ Create New Calendar] [Import Template]


Calendar Cards Grid:

Display all user's calendars as cards:

┌─────────────────────────────────┐
│ 📝 Content Calendar             │
│ Purpose: Blog & social planning │
│ View: Monthly | Private         │
│ 12 active plans                 │
│ [Open] [Settings] [⋮]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 💼 Business Operations          │
│ Purpose: Daily tasks & meetings │
│ View: Weekly | Team             │
│ 8 active plans                  │
│ [Open] [Settings] [⋮]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🎯 Campaign Calendar            │
│ Purpose: Marketing campaigns    │
│ View: Monthly | Organization    │
│ 3 active plans                  │
│ [Open] [Settings] [⋮]          │
└─────────────────────────────────┘


Quick Actions Sidebar:

🤖 Ask AI to Generate Plans
📋 Browse Templates
📊 View All Plans (List)
⚙️ Calendar Settings


Recent Activity:

Today:
• 3 plans due
• 1 meeting at 2 PM
• 2 tasks in progress

This Week:
• 12 plans scheduled
• 5 tasks completed


Actions:

Click card → Opens calendar view

Click "Create New Calendar" → Triggers Step 2

Click "Ask AI" → Triggers Step 4 (AI Assistant)

STEP 2: CREATE NEW CALENDAR

Page: /marketing/calendar/new

Breadcrumb: Marketing AI > Calendar > New Calendar

Calendar Creation Form:

SECTION 1: Basic Information

1.1 Calendar Name (Required)

Text input: e.g., "Q1 Content Calendar"

Character limit: 50 characters

Unique per user

1.2 Calendar Purpose

Dropdown with suggestions:

Personal Planning

Team Planning

Content Calendar

Campaign Calendar

Business Operations

Project Management

Custom (text input)

1.3 Description (Optional)

Textarea: Brief description of calendar purpose

Character limit: 200 characters

SECTION 2: Settings

2.1 Default View

⚪ Daily View

⚪ Weekly View

⚪ Monthly View (Default)

⚪ Agenda / List View

2.2 Visibility

⚪ Private (Only you)

⚪ Team (Your team members)

⚪ Organization (Everyone in org)

2.3 Calendar Color

Color picker: Choose calendar theme color

Default color suggestions

SECTION 3: Plan Types Allowed

Select which types of plans can be added to this calendar:

□ Tasks (To-dos, action items)

□ Content Plans (Blogs, social posts, etc.)

□ Meetings (Scheduled meetings)

□ Reminders (Notifications, deadlines)

□ Campaign Items (Marketing campaigns)

□ Custom Events (User-defined)

Default: All selected

SECTION 4: Advanced Options (Collapsible)

4.1 Time Settings

Start of week: Dropdown (Sunday/Monday)

Working hours: 9:00 AM - 5:00 PM (editable)

Time zone: Auto-detected (editable)

4.2 Recurring Plans

□ Enable recurring plans

Default recurrence: None/Daily/Weekly/Monthly

4.3 Notifications

□ Email reminders

□ In-app notifications

Reminder timing: 1 hour before (configurable)

SECTION 5: Quick Start Options

Instead of empty calendar, start with:

⚪ Blank Calendar (Start from scratch)

⚪ Use Template (Select from templates)

⚪ Generate with AI (AI creates initial plans)

Summary Panel (Sticky Right Side):

📅 Calendar Preview

Name: Q1 Content Calendar
Purpose: Content Calendar
View: Monthly
Visibility: Private

Plan Types: 6 types enabled
Notifications: Enabled

[Create Calendar] [Save as Draft]


Actions:

"Create Calendar" → Creates calendar, redirects to Step 3

"Use Template" → Shows template gallery

"Generate with AI" → Triggers Step 4 with calendar context

STEP 3: CALENDAR VIEW & NAVIGATION

Page: /marketing/calendar/[calendarId]

Breadcrumb: Marketing AI > Calendar > [Calendar Name]

Main Calendar Interface:

TOP NAVIGATION BAR:

[← Back to Dashboard]  📅 Content Calendar  [Settings ⚙️]

View: [Daily] [Weekly] [Monthly ●] [Agenda]

[← Previous] [Today] [Next →]  |  [Jump to Date 📆]

[+ New Plan ▼] [🤖 Ask AI] [Filter 🔽] [Export]


CALENDAR GRID (Monthly View Example):

            January 2025
Mon  Tue  Wed  Thu  Fri  Sat  Sun
           1    2    3    4    5
     📝   📝        🎯
     
 6    7    8    9   10   11   12
💼   📝   📝        📝   
     
13   14   15   16   17   18   19
📝   💼   📝   🎯   📝

20   21   22   23   24   25   26
📝        📝   📝   📝   

27   28   29   30   31
📝   💼   📝   📝   📝


Legend:

📝 = Task

💼 = Meeting

🎯 = Campaign Item

🔔 = Reminder

Date Cell Interaction:

Click empty date:

┌─────────────────────┐
│ + Add Plan          │
│ ─────────────────── │
│ □ Task             │
│ □ Content Plan     │
│ □ Meeting          │
│ □ Reminder         │
│ □ Campaign Item    │
│ □ Custom           │
└─────────────────────┘


Click existing plan:

┌────────────────────────────────┐
│ 📝 Write Blog Post             │
│ ───────────────────────────── │
│ Date: Jan 15, 2025            │
│ Status: Planned               │
│ Priority: High                │
│                               │
│ [Edit] [Complete] [Delete]   │
└────────────────────────────────┘


RIGHT SIDEBAR:

Today's Plans:

📋 Today - January 15

📝 Write Blog Post
   Status: In Progress
   Due: 5:00 PM
   [Mark Complete]

💼 Team Meeting
   Time: 2:00 PM
   Duration: 1 hour
   [Join]

🎯 Launch Campaign
   Status: Planned
   [View Details]


Upcoming (Next 7 Days):

Thu Jan 16: 2 plans
Fri Jan 17: 1 plan
Mon Jan 20: 3 plans


Quick Actions:

[🤖 Generate Plans with AI]

[📋 Apply Template]

[🔄 Sync External Calendar]

WEEKLY VIEW (Alternative Layout):

Week of Jan 13-19, 2025

Time   Mon 13  Tue 14  Wed 15  Thu 16  Fri 17  Sat 18  Sun 19
9 AM   📝      💼      📝              📝
10 AM                  📝              📝
11 AM                                  
12 PM                  🎯              
1 PM           📝                      
2 PM                   💼              📝
3 PM   📝                              
4 PM                                   
5 PM                   📝              📝


DAILY VIEW (Alternative Layout):

Tuesday, January 15, 2025

[← Jan 14] [Today] [Jan 16 →]

Timeline:
─────────────────────────────
8:00 AM

9:00 AM  ┌─────────────────┐
         │ 📝 Write Blog   │
         │ 2 hours         │
10:00 AM │                 │
         └─────────────────┘

11:00 AM

12:00 PM

1:00 PM

2:00 PM  ┌─────────────────┐
         │ 💼 Team Meeting │
         │ 1 hour          │
3:00 PM  └─────────────────┘

4:00 PM

5:00 PM  ┌─────────────────┐
         │ 📝 Review Draft │
6:00 PM  └─────────────────┘


AGENDA / LIST VIEW:

Agenda - All Plans

📅 Today - January 15
  📝 Write Blog Post (9:00 AM - 11:00 AM)
  💼 Team Meeting (2:00 PM - 3:00 PM)
  📝 Review Draft (5:00 PM - 6:00 PM)

📅 Tomorrow - January 16
  📝 Edit Blog Post (10:00 AM)
  🎯 Launch Email Campaign (All day)

📅 Thursday - January 17
  📝 Publish Blog Post (9:00 AM)
  📝 Social Media Posts (2:00 PM)


Drag & Drop Functionality:

Drag plan to different date → Reschedule

Drag edges to resize → Adjust duration

Drag between calendars (if overlay enabled)

Filtering Options:

Click "Filter" button:

┌──────────────────────┐
│ Filter Plans         │
│ ──────────────────── │
│ □ Tasks             │
│ □ Meetings          │
│ □ Content Plans     │
│ □ Reminders         │
│ □ Campaign Items    │
│                     │
│ Status:             │
│ □ Planned           │
│ □ In Progress       │
│ □ Completed         │
│ □ Overdue           │
│                     │
│ Priority:           │
│ □ High              │
│ □ Medium            │
│ □ Low               │
│                     │
│ [Apply] [Reset]     │
└──────────────────────┘


STEP 4: CREATE/EDIT PLAN MANUALLY

Page: /marketing/calendar/[calendarId]/plan/new (Slide-in panel or modal)

Breadcrumb: Marketing AI > Calendar > [Calendar Name] > New Plan

Plan Creation Form:

SECTION 1: Plan Type (Select first)

Choose Plan Type:

[📝 Task]  [📄 Content]  [💼 Meeting]  
[🔔 Reminder]  [🎯 Campaign]  [⚙️ Custom]


Once selected, show type-specific form:

COMMON FIELDS (All Plan Types):

1.1 Title (Required)

Text input: e.g., "Write blog post on AI trends"

Character limit: 100 characters

1.2 Description (Optional)

Textarea: Detailed description

Rich text editor (basic formatting)

Character limit: 500 characters

1.3 Date & Time

Date picker: Select date (required)

Time picker: Select start time (optional for all-day events)

Duration: 30 min / 1 hour / 2 hours / Custom / All day

□ All day event

1.4 Priority

⚪ Low

⚪ Medium (Default)

⚪ High

⚪ Urgent

1.5 Status

⚪ Planned (Default)

⚪ In Progress

⚪ Completed

⚪ Skipped

1.6 Tags (Optional)

Input: Add tags (comma separated)

Suggested tags based on calendar and past plans

Example: #blog, #marketing, #urgent

TYPE-SPECIFIC FIELDS:

For Task:

Checklist Items (Optional):
- □ Research topic
- □ Write outline
- □ Write draft
- □ Edit & proofread
[+ Add Item]


For Content Plan:

Content Type:
- ⚪ Blog Post
- ⚪ Social Media Post
- ⚪ Email Newsletter
- ⚪ Video
- ⚪ Other

Platform (if social):
- □ LinkedIn
- □ Twitter
- □ Instagram
- □ Facebook

Linked Keyword:
- [Search keywords from keyword research]
- Optional: Connect to existing keyword research


For Meeting:

Meeting Details:
- Location: Text input or "Virtual"
- Attendees: Email inputs (comma separated)
- Meeting Link: URL input (Zoom, Google Meet, etc.)
- □ Send calendar invites


For Reminder:

Reminder Settings:
- Remind me: Dropdown (On time, 10 min before, 30 min, 1 hour, 1 day)
- Notification: □ Email  □ In-app  □ Push


For Campaign:

Campaign Details:
- Campaign Name: Text input
- Budget: Number input (optional)
- Target Audience: Text input
- Expected Outcome: Text input


SECTION 2: Advanced Options (Collapsible)

2.1 Assign To

Dropdown: Select team member (if team calendar)

Default: Current user

2.2 Recurring Plan

□ Make this recurring

Repeat: Daily / Weekly / Monthly / Custom

Repeat every: Number input + unit

End: Never / On date / After X occurrences

2.3 Dependencies (Optional)

Link to other plans: "This plan depends on..."

Search existing plans

2.4 Attachments (Optional)

Upload files, images, documents

Link to external resources

Summary Panel (Right side):

📝 Plan Preview

Type: Task
Date: Jan 15, 2025
Time: 9:00 AM - 11:00 AM
Priority: High
Status: Planned

Tags: #blog #writing

[Save Plan] [Save & Add Another]


Actions:

"Save Plan" → Creates plan, returns to calendar

"Save & Add Another" → Creates plan, stays on form

"Cancel" → Discard changes

STEP 5: AI-ASSISTED PLAN GENERATION

Page: Modal/Panel overlay on calendar view

Triggered by: "🤖 Ask AI" button or "Generate with AI" option

AI Assistant Interface (Hey Cortana Style):

HEADER:

🤖 AI Planning Assistant

"I'll help you create a plan for your calendar. 
Just tell me what you need!"


QUICK START TEMPLATES (Buttons):

[📅 30-Day Content Plan]
[📊 Weekly Business Tasks]  
[📝 Daily Productivity Plan]
[🎯 Campaign Calendar]
[⚙️ Custom Plan...]


OR: CUSTOM PLAN BUILDER

STEP 5A: Select Time Range

📆 Select Time Period:

View:
⚪ Daily (Next 7 days)
⚪ Weekly (Next 4 weeks)
⚪ Monthly (Current month) ●
⚪ Custom Date Range

If Monthly selected:
┌──────────────────┐
│  January 2025   │
│  [Select Month]  │
└──────────────────┘

Or Custom Range:
From: [Jan 1, 2025]  To: [Jan 31, 2025]

[Continue]


STEP 5B: Plan Configuration

🎯 What kind of plan do you need?

Plan Purpose:
⚪ Content Creation (blogs, social, emails)
⚪ Business Operations (tasks, meetings, admin)
⚪ Marketing Campaign (launches, promotions)
⚪ Personal Productivity (daily planning)
⚪ Mixed (combination of above)

Business Context (Optional):
Industry: [Text input] e.g., "Digital Marketing Agency"
Goal: 
  ⚪ Growth & Expansion
  ⚪ Consistency & Routine
  ⚪ Product/Campaign Launch
  ⚪ Productivity & Efficiency

Plan Frequency:
⚪ Every day
⚪ Weekdays only (Mon-Fri)
⚪ 3 times per week
⚪ 2 times per week
⚪ Custom: [___] times per week

Plan Type Distribution:
- Tasks: [40%] ████░░
- Content: [30%] ███░░░
- Meetings: [20%] ██░░░░
- Other: [10%] █░░░░░

[Adjust sliders for custom distribution]

[Continue]


STEP 5C: AI Generation

🤖 Generating your plan...

✓ Analyzing calendar
✓ Selecting optimal dates
✓ Creating plan topics
✓ Assigning priorities

[Progress bar: 75%]

This usually takes 10-15 seconds...


STEP 5D: Review AI-Generated Plan

📋 AI Generated Plan - January 2025

Review and edit before applying:

┌────────────────────────────────────────┐
│ Mon, Jan 6                             │
│ 📝 Plan marketing strategy for Q1      │
│ Priority: High | 2 hours               │
│ [Edit] [Remove]                        │
├────────────────────────────────────────┤
│ Wed, Jan 8                             │
│ 📄 Write blog: "AI Trends in 2025"    │
│ Priority: Medium | 3 hours             │
│ [Edit] [Remove]                        │
├────────────────────────────────────────┤
│ Fri, Jan 10                            │
│ 📝 Create social media content batch   │
│ Priority: Medium | 2 hours             │
│ [Edit] [Remove]                        │
├────────────────────────────────────────┤
│ Mon, Jan 13                            │
│ 💼 Team brainstorming meeting          │
│ Priority: High | 1 hour                │
│ [Edit] [Remove]                        │
└────────────────────────────────────────┘

... 12 more plans

Total: 16 plans generated
Distribution: 8 tasks, 5 content, 3 meetings

[Regenerate All] [Edit Individual] [Apply to Calendar ✓]


Edit Individual Plan:

Click "Edit" → Opens inline editor with all plan fields

Make changes → Auto-saves

Regenerate Options:

[Regenerate All Plans]
[Regenerate Selected Dates Only]
[Generate More Plans for Empty Dates]


ACTIONS:

"Apply to Calendar" → Adds all plans to calendar

"Save as Template" → Save this plan structure as reusable template

"Start Over" → Go back to Step 5A

STEP 6: TEMPLATE GALLERY

Page: /marketing/calendar/templates

Breadcrumb: Marketing AI > Calendar > Templates

Template Categories:

SECTION 1: Pre-Built Templates

📋 Template Gallery

Search: [Search templates...] [Filter by category ▼]

Categories:
[All] [Content] [Business] [Personal] [Campaigns] [Custom]


Template Cards:

┌─────────────────────────────────────┐
│ 📅 30-Day Content Calendar          │
│ ─────────────────────────────────── │
│ Perfect for consistent content      │
│ creation. Includes blog posts,      │
│ social media, and newsletters.      │
│                                     │
│ • 30 days                           │
│ • 20 plans (mixed types)            │
│ • 3x per week frequency             │
│                                     │
│ [Preview] [Use Template]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💼 Weekly Business Operations       │
│ ─────────────────────────────────── │
│ Standard weekly tasks for business  │
│ operations, meetings, and reviews.  │
│                                     │
│ • 7 days (weekly repeat)            │
│ • 15 plans (tasks & meetings)       │
│ • Weekdays only                     │
│                                     │
│ [Preview] [Use Template]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🎯 Product Launch Campaign          │
│ ─────────────────────────────────── │
│ Complete 60-day campaign calendar   │
│ for product launches.               │
│                                     │
│ • 60 days                           │
│ • 35 plans (campaign items)         │
│ • Milestone-based                   │
│                                     │
│ [Preview] [Use Template]            │
└─────────────────────────────────────┘


SECTION 2: My Custom Templates

User-saved templates from previous AI generations:

Your Templates:

┌─────────────────────────────────────┐
│ 📝 My Content Workflow              │
│ Created: Jan 5, 2025                │
│ Used: 3 times                       │
│ [Use] [Edit] [Delete]               │
└─────────────────────────────────────┘


Template Preview Modal:

Click "Preview" on any template:

┌────────────────────────────────────────┐
│ 📅 30-Day Content Calendar             │
│ ────────────────────────────────────── │
│                                        │
│ Week 1:                                │
│ • Mon: Blog outline                    │
│ • Wed: Write blog draft                │
│ • Fri: Social media batch creation     │
│                                        │
│ Week 2:                                │
│ • Mon: Edit & publish blog             │
│ • Wed: Email newsletter                │
│ • Fri: Video script                    │
│                                        │
│ ... [View Full Template]               │
│                                        │
│ [Use This Template] [Customize]        │
└────────────────────────────────────────┘


Actions:

"Use Template" → Apply to selected calendar with date selection

"Customize" → Opens AI assistant with template as starting point

"Save as Template" → From any calendar view

STEP 7: PLAN DETAIL VIEW & MANAGEMENT

Page: /marketing/calendar/[calendarId]/plan/[planId]

Breadcrumb: Marketing AI > Calendar > [Calendar Name] > [Plan Title]

Plan Detail Page:

HEADER:

[← Back to Calendar]

📝 Write Blog Post on AI Trends

Status: In Progress | Priority: High

[Edit] [Complete] [Delete] [Duplicate]


MAIN CONTENT:

Section: Details

📅 Date & Time:
   Wednesday, January 15, 2025
   9:00 AM - 11:00 AM (2 hours)

📋 Description:
   Research and write comprehensive blog post covering 
   the top 10 AI trends expected in 2025. Include 
   statistics, expert quotes, and actionable insights.

🏷️ Tags:
   #blog #ai #content #2025trends

👤 Assigned To:
   John Doe (You)

🔗 Related:
   • Linked Keyword: "AI trends 2025"
   • Related Plan: "Social media promotion" (Jan 17)


Section: Checklist (if type: Task)

Progress: 3/5 completed

✓ Research top AI trends
✓ Gather statistics and data
✓ Create outline
□ Write first draft
□ Edit and proofread

[+ Add Checklist Item]


Section: Activity Log

📜 Activity:

Jan 15, 9:30 AM - Status changed to "In Progress"
Jan 15, 9:00 AM - Checklist item completed
Jan 14, 3:00 PM - Plan created by AI Assistant
Jan 14, 3:00 PM - Tags added: #blog, #ai

[View Full History]


Section: Attachments

📎 Attachments:

• research_notes.pdf (245 KB)
  Uploaded Jan 15, 9:15 AM
  [Download] [Remove]

• ai_statistics_2025.xlsx (89 KB)
  Uploaded Jan 15, 10:00 AM
  [Download] [Remove]

[+ Upload File]


RIGHT SIDEBAR:

Quick Actions:

⚡ Quick Actions:

[✓ Mark Complete]
[⏸️ Pause (Skip)]
[📅 Reschedule]
[🔄 Make Recurring]
[👥 Assign to Someone]
[🔗 Link to Another Plan]


Reminders:

🔔 Reminders:

□ 1 hour before (8:00 AM)
□ On the day (9:00 AM)
□ Email notification

[Save Reminder Settings]


Related Plans:

🔗 Related Plans:

📝 Create social media posts
   Jan 17, 2025

📝 Schedule email newsletter
   Jan 20, 2025

[+ Link Another Plan]


STEP 8: CALENDAR SETTINGS & MANAGEMENT

Page: /marketing/calendar/[calendarId]/settings

Breadcrumb: Marketing AI > Calendar > [Calendar Name] > Settings

Settings Tabs:

TAB 1: General

⚙️ General Settings

Calendar Name:
[Content Calendar]

Purpose:
[Blog & social media planning ▼]

Description:
[Textarea: Managing all content creation...]

Calendar Color:
[Color Picker: Blue]

Default View:
⚪ Daily
⚪ Weekly
● Monthly (Selected)
⚪ Agenda

Time & Region:
Start of Week: [Monday ▼]
Time Zone: [GMT-5 Eastern Time ▼]

[Save Changes]


TAB 2: Sharing & Members

👥 Team Access & Permissions

Active Members:
1. John Doe (Owner)
2. Sarah Jenkins (Editor)  [▼] [Remove]
3. Mike Thomas (Viewer)    [▼] [Remove]

[+ Invite New Member]
Email: [Enter email address]
Role: [Viewer / Editor / Admin ▼]
[Send Invitation]

Public Access:
□ Enable public read-only link
Link: [https://app.calendar.ai/shared/xyz123](https://app.calendar.ai/shared/xyz123) [Copy]


TAB 3: Integrations

🔌 Connected Apps

Google Calendar:
[Connect Google Account]
Status: 🔴 Not Connected
Settings: □ Sync plans to Google  □ Sync events from Google

Slack:
[Connect Workspace]
Status: 🟢 Connected to #marketing-team
Alerts: □ Daily Digest  □ New Plan Created  □ Due Dates

Export Data:
[Download .ICS (iCal)]
[Download .CSV]
[Download JSON]
[Download PDF]

TAB 4: Danger Zone

⚠️ Danger Zone

Archive Calendar:
Hide this calendar from your dashboard but keep all data.
[Archive Calendar]

Delete Calendar:
Permanently delete this calendar and all 12 associated plans.
This action cannot be undone.
[Delete Calendar]


IMPLEMENTATION NOTES & DATA STRUCTURE

1. Database Schema Concepts (Firestore/NoSQL)

Collection: calendars

{
  "id": "cal_123",
  "ownerId": "user_001",
  "name": "Content Calendar",
  "type": "content",
  "view": "monthly",
  "members": ["user_001", "user_002"],
  "settings": { "color": "#2196F3", "timezone": "UTC" }
}


Collection: plans

{
  "id": "plan_999",
  "calendarId": "cal_123",
  "title": "Write Blog Post",
  "start": "2025-01-15T09:00:00Z",
  "end": "2025-01-15T11:00:00Z",
  "type": "content",
  "status": "in_progress",
  "priority": "high",
  "aiGenerated": true,
  "checklist": [{ "text": "Research", "done": true }]
}


2. AI Prompt Engineering Strategy

For the "Generate with AI" feature, the system should construct a prompt including:

Context: Calendar purpose and user industry.

Constraints: Time range, working hours, plan distribution preference.

Output Format: Strict JSON array of objects with titles, descriptions, and estimated durations.

3. Mobile Responsiveness

Calendar Grid: Collapses to "Agenda View" or "3-Day View" on screens < 768px.

Sidebar: Becomes a slide-out drawer (hamburger menu).

Drag & Drop: Replaced by "Long Press -> Move" or "Tap to Edit Date" on touch devices.






EXCELBEES POSTER 01 - AI IMAGE GENERATOR PROMPT

Create a modern, educational infographic-style vertical poster (1080x1350px) with a split-screen design showing digital marketing evolution. 

DESIGN LAYOUT:
Left side: OLD MARKETING APPROACH (faded, muted colors - grays and dark blues)
Right side: NEW MARKETING APPROACH (vibrant, modern colors - bright blues, tech purples, white)
Center dividing line: Thick gradient arrow pointing right showing transformation/evolution

TYPOGRAPHY & HEADLINES:
Main Title (Top, Tamil + English bilingual):
"Digital Marketing மாற்றம் | 2026 Tamil Nadu Business Game Changer"
Font: Bold, modern sans-serif (Montserrat Black or similar)
Color: Gradient from tech blue to vibrant purple
Size: Dominant, occupies top 15% of poster

VISUAL CONTENT - LEFT SIDE (OLD APPROACH):
Visual elements: Large celebrity/influencer figure, megaphone icon, traditional ads, one-way communication arrows
Text overlay: "Celebrity Endorsements" "Broad Audience Marketing" "High Production Time" "Low Engagement ROI"
Color palette: Muted grays, dark blue, faded golds
Effect: Slightly desaturated, appears dated

VISUAL CONTENT - RIGHT SIDE (NEW APPROACH):
Visual elements: Multiple small diverse creator icons/avatars, interconnected network nodes, organic growth arrows, AI chip symbol, clock showing speed
Text overlay: "Micro-Creators" "Niche Audience Targeting" "AI-Powered Automation" "75% Higher ROI"
Color palette: Vibrant electric blues, tech purples, bright whites, neon accents
Effect: Sharp, modern, energy-filled

CENTER SPLIT DESIGN:
Thick vertical gradient line separating old from new
Arrow or lightning bolt symbol pointing from left to right indicating transformation
Subtle tech patterns/circuits in the background

STATISTICS SHOWCASE (Bottom 40% of poster):
Three data cards arranged horizontally with icon-statistic pairs:

CARD 1 (Top-left of statistics section):
Icon: Micro-creator profile silhouettes (3-4 diverse faces)
Statistic: "75% Higher Engagement ROI"
Supporting text: "Micro-creators drive superior results vs celebrity endorsements"
Style: White box with blue accent border, clean typography

CARD 2 (Center of statistics section):
Icon: AI circuit board or chip with speed lines
Statistic: "60% Faster Production"
Supporting text: "AI-powered content creation reduces production time dramatically"
Style: White box with purple accent border, clean typography

CARD 3 (Top-right of statistics section):
Icon: Tamil Nadu map with distributed tech dots/network nodes
Statistic: "32 Districts Strong"
Supporting text: "Tamil Nadu software exports showcase regional tech innovation"
Style: White box with gradient accent border (blue to purple), clean typography

CALL-TO-ACTION (Bottom 8%):
Text: "Learn how to leverage micro-creator strategies for your business"
Branding text: "Excelbees Digital Intelligence Hub"
Design: Subtle button-like appearance with rounded corners, light background
Color: Soft gray background with dark text for readability

BRANDING ELEMENTS:
Excelbees logo: Bottom right corner, small and subtle (not dominant)
Tagline below logo: "Digital Intelligence Hub"
Effect: Watermark style, transparent effect at 60% opacity

OVERALL DESIGN SPECIFICATIONS:
Color palette: Primary (Tech Blue #0066FF), Secondary (Vibrant Purple #7B2CBF), Accent (Electric Green #00FF88), Neutral (White #FFFFFF, Light Gray #F5F5F5)
Typography: Modern sans-serif (English: Montserrat/Poppins, Tamil: Arial Unicode or native Tamil font)
Style: Flat design with subtle 3D depth on cards, minimal shadows, high contrast
Background: Subtle gradient from light gray to white, with faint tech circuit patterns
Finish: Clean, professional, modern, data-driven aesthetic without appearing corporate/cold

TECHNICAL REQUIREMENTS:
Format: Vertical rectangle 1080x1350px
Resolution: High resolution, suitable for Instagram feed
Bilingual text: Both Tamil and English integrated naturally
Accessibility: High contrast ratios, readable text at thumbnail size
Tone: Educational, trendy, authoritative without being promotional or salesy

MOOD & FEELING:
Modern, forward-thinking, empowering, data-backed, trendy, Tamil-inclusive, technology-optimistic, community-focused, educational authority, vibrant yet professional

AVOID:
Product promotion, pricing mentions, sales language, corporate stiffness, dated design elements, poor contrast, unreadable fonts, cluttered layout, celebrity faces, cheesy stock photos

END PROMPT