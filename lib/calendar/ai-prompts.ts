import { AIGenerateRequest } from "@/types/calendar";

/**
 * Generate AI prompt for plan generation
 */
export function getPlanGenerationPrompt(request: AIGenerateRequest): string {
  const { timeRange, purpose, businessContext, frequency, distribution } = request;

  const startDate = new Date(timeRange.start).toLocaleDateString();
  const endDate = new Date(timeRange.end).toLocaleDateString();
  const days = Math.ceil(
    (new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let contextSection = "";
  if (businessContext) {
    contextSection = `
BUSINESS CONTEXT:
- Industry: ${businessContext.industry}
- Goal: ${businessContext.goal}
`;
  }

  const frequencyMap: Record<string, string> = {
    daily: "Every day",
    weekdays: "Weekdays only (Monday-Friday)",
    "3x_week": "3 times per week",
    "2x_week": "2 times per week",
  };

  return `You are an AI planning assistant helping to create a ${days}-day calendar plan.

TIME PERIOD:
- Start: ${startDate}
- End: ${endDate}
- Duration: ${days} days

PLAN PURPOSE: ${purpose}
${contextSection}
FREQUENCY: ${frequencyMap[frequency] || frequency}

PLAN DISTRIBUTION:
- Tasks: ${distribution.tasks}%
- Content: ${distribution.content}%
- Meetings: ${distribution.meetings}%
- Other: ${distribution.other}%

REQUIREMENTS:
1. Create realistic, actionable plans spread across the time period
2. Ensure proper spacing between plans (don't overcrowd days)
3. Consider typical working hours (9 AM - 5 PM)
4. Make plans specific and meaningful, not generic
5. Assign appropriate priorities (high/medium/low)
6. Include estimated durations for each plan
7. Add relevant tags for categorization

OUTPUT FORMAT:
Return a JSON array of plan objects with this exact structure:
[
  {
    "title": "Specific, actionable plan title",
    "description": "Brief description of what needs to be done",
    "type": "task|content|meeting|reminder|campaign",
    "start": "YYYY-MM-DDTHH:mm:ss.000Z",
    "end": "YYYY-MM-DDTHH:mm:ss.000Z",
    "allDay": false,
    "priority": "high|medium|low",
    "status": "planned",
    "tags": ["tag1", "tag2"],
    "metadata": {
      // Type-specific fields based on plan type
    }
  }
]

IMPORTANT:
- Return ONLY the JSON array, no explanations
- Ensure all dates are within the specified time range
- Use ISO 8601 format for dates
- Make titles clear and actionable
- Distribute plans evenly across the time period
- Consider the specified frequency when spacing plans

Generate the plan now:`;
}

/**
 * Generate AI prompt for template customization
 */
export function getTemplateCustomizationPrompt(
  templateName: string,
  templateDescription: string,
  customization: {
    startDate: Date;
    duration: number;
    modifications?: string;
  }
): string {
  return `You are customizing a calendar template for a user.

TEMPLATE: ${templateName}
DESCRIPTION: ${templateDescription}

CUSTOMIZATION:
- Start Date: ${customization.startDate.toLocaleDateString()}
- Duration: ${customization.duration} days
${customization.modifications ? `- Requested Changes: ${customization.modifications}` : ""}

TASK:
Adjust the template plans to fit the new time period and apply any requested modifications.
Maintain the spirit and structure of the original template while adapting to the user's needs.

OUTPUT FORMAT:
Return a JSON array of plan objects following the same structure as plan generation.

Generate the customized plan now:`;
}
