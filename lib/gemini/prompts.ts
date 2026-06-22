export const PROMPTS = {
  searchIntent: (query: string) => `You are a CRM search assistant. Parse the user's natural language query into a structured JSON search intent.

Available collections and their fields:
- leads: firstName, lastName, email, phone, companyName, jobTitle, status (New|Contacted|Follow Up|Qualified|Lost), source (Website|Referral|Ads|Cold Call|Other), value (number), ownerId, createdAt, updatedAt, lastContactedAt
- contacts: firstName, lastName, email, phone, companyId, companyName, jobTitle, ownerId, createdAt, lastContactedAt
- companies: name, domain, email, phone, industry, size (1-10|11-50|51-200|201-500|501-1000|1000+), annualRevenue, ownerId
- deals: title, stage (Pipeline|Follow Up|Schedule Service|Conversation|Won|Lost), value (number), probability (0-100), companyId, companyName, contactIds, ownerId, closeDate, createdAt, updatedAt, archived
- projects: name, description, status (Planning|Development|Active|On Hold|Completed|Management|Cancelled), priority (Low|Medium|High|Critical), companyId, dealId, ownerId, progress (0-100), startDate, endDate, budget
- tasks: title, description, type (To Do|Call|Email|Meeting), status (To Do|In Progress|Review|Done), priority (Low|Medium|High|Urgent), assigneeId, projectId, dueDate, ownerId, isArchived
- invoices: invoiceNumber, status (Draft|Sent|Paid|Overdue|Cancelled), companyName, contactName, total (number), issueDate, dueDate, ownerId

Return JSON in this exact format:
{"collection": "leads", "filters": {"status": "Follow Up"}, "sortBy": "updatedAt", "displayQuery": "Deals in follow up stage"}

For relative dates, convert to ISO format (e.g., "last week" = 7 days ago). Use null for filters you cannot determine. Pick the most relevant collection.

User query: "${query}"`,

  leadScore: (leadJson: string) => `You are an expert sales analyst. Analyze this lead and provide a qualification score.

Lead data:
${leadJson}

Evaluate based on:
1. Data completeness (email, phone, company, job title present?)
2. Company signals (industry, size indicators from company name)
3. Source quality (Referral > Website > Ads > Cold Call)
4. Value potential
5. Engagement recency (lastContactedAt)

Return JSON:
{"score": 75, "tier": "warm", "reasoning": ["Strong company name", "Referral source"], "suggestedActions": ["Call within 48 hours", "Send case study"]}

Score: 0-100. Tier: "hot" (70+), "warm" (40-69), "cold" (0-39).`,

  dealInsight: (dealJson: string, activities: string) => `You are a sales pipeline analyst. Analyze this deal and its recent activities.

Deal data:
${dealJson}

Recent activities:
${activities || "No recent activities."}

Evaluate:
1. Time in current stage (stalled = risk)
2. Deal value vs. probability alignment
3. Contact engagement signals from activities
4. Close date proximity

Return JSON:
{"winProbability": 65, "riskLevel": "medium", "keyFactors": ["Deal in follow-up for 14 days", "No contact in 7 days"], "recommendedNextStep": "Schedule a check-in call this week", "estimatedCloseDate": "2026-07-01"}

winProbability: 0-100. riskLevel: "low"|"medium"|"high".`,

  emailDraft: (prompt: string, context: string) => `You are a professional email writing assistant for a CRM system. Write a complete email based on the user's request.

Context:
${context}

User request: "${prompt}"

Return JSON:
{"subject": "Subject line here", "body": "Email body here", "tone": "professional"}

Keep the email concise, professional, and actionable. Use the context to personalize. Do not use placeholders if real data is available.`,

  emailRewrite: (text: string, tone: string, goal: string, length: string) => `You are a professional writing assistant. Rewrite the following text.

Original text:
"${text}"

Requirements:
- Tone: ${tone}
- Goal: ${goal}
- Length: ${length}

Return ONLY the rewritten text, no JSON, no markdown, no explanation.`,

  taskPriority: (tasksJson: string) => `You are a productivity analyst. Rank these tasks by priority based on urgency, due dates, and business impact.

Tasks:
${tasksJson}

Return JSON array:
[{"taskId": "task-id-here", "suggestedPriority": "High", "reasoning": "Due tomorrow and linked to high-value deal"}]

suggestedPriority: "Low"|"Medium"|"High"|"Urgent". Rank from most to least urgent.`,

  followUp: (entitiesJson: string) => `You are a CRM sales assistant. Analyze these entities and identify which ones need follow-up, ranked by urgency.

Entities (leads, deals, contacts):
${entitiesJson}

Return JSON array (max 8 items):
[{"entityId": "id", "entityType": "lead", "entityName": "John Doe", "urgency": "high", "reason": "No contact in 14 days", "suggestedAction": "Call to check in", "suggestedDate": "2026-06-16"}]

urgency: "high"|"medium"|"low". Only include entities that genuinely need follow-up.`,

  sentiment: (activitiesJson: string) => `You are a CRM relationship analyst. Analyze these communication activities and assess the relationship health.

Activities (most recent first):
${activitiesJson || "No activities found."}

Return JSON:
{"sentiment": "positive", "score": 0.65, "keyTopics": ["pricing", "timeline", "onboarding"], "summary": "Overall positive engagement with active discussions about pricing.", "actionItems": ["Send updated pricing sheet", "Schedule demo"]}

sentiment: "positive"|"neutral"|"negative"|"mixed". score: -1.0 to 1.0.`,

  meeting: (notes: string) => `You are a meeting notes assistant. Parse these raw meeting notes and produce a structured summary.

Meeting notes:
${notes}

Return JSON:
{"summary": "Brief overview paragraph", "keyPoints": ["Point 1", "Point 2"], "actionItems": [{"task": "Send proposal", "assignee": "John", "dueDate": "2026-06-20"}], "decisions": ["Approved Q3 budget"]}

Extract action items, key decisions, and main discussion points. If assignees or dates are mentioned, include them.`,

  reportInsight: (query: string, context: string) => `You are a business intelligence analyst for a CRM. Analyze the following business data and provide insights.

Business data:
${context}

Question: "${query}"

Return JSON:
{"summary": "Overall summary paragraph", "insights": [{"type": "positive", "text": "Revenue up 15%"}, {"type": "warning", "text": "3 leads at risk"}], "recommendations": ["Focus on follow-ups", "Review pipeline coverage"]}

type: "positive"|"negative"|"warning".`,
} as const;
