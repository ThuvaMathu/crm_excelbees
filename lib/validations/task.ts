import * as z from "zod";

export const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["To Do", "In Progress", "Review", "Done"]),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  type: z.enum(["To Do", "Call", "Email", "Meeting"]),
  dueDate: z.date().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  dealId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // New fields for filtering and archiving
  associates: z.array(z.string()).default([]),
  isArchived: z.boolean().default(false),
});

export type TaskFormData = z.infer<typeof taskSchema>;
