import {
  Shield,
  Bot,
  Building2,
  TrendingUp,
  FolderKanban,
  FileText,
  Mail,
  BarChart3,
  Plug,
} from "lucide-react";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export const features: Feature[] = [
  {
    id: "1",
    title: "Role-Based Access Control",
    description:
      "Granular permission layers for Admin, Manager, Team, and Scanner roles. Every user sees exactly what they need — nothing more, nothing less.",
    icon: Shield,
  },
  {
    id: "2",
    title: "AI-Powered Automation",
    description:
      "Auto-fill contacts, enrich leads, draft follow-up emails, and surface insights — all powered by an integrated AI assistant that learns your workflow.",
    icon: Bot,
  },
  {
    id: "3",
    title: "Contacts & Companies",
    description:
      "A complete contact book linked to company profiles. Track relationships, interaction history, and deal associations across your entire client base.",
    icon: Building2,
  },
  {
    id: "4",
    title: "Lead & Deal Pipeline",
    description:
      "Kanban-style pipeline management for leads and deals. Move cards across stages, set close dates, and never miss a follow-up.",
    icon: TrendingUp,
  },
  {
    id: "5",
    title: "Projects, Tasks & Notes",
    description:
      "Manage client deliverables end-to-end. Assign tasks, track milestones, attach notes — all linked to the lead or deal that created the work.",
    icon: FolderKanban,
  },
  {
    id: "6",
    title: "Invoices & Quotes",
    description:
      "Create GST-inclusive quotes, convert them to invoices in one click, and send branded PDF documents — all with AUD pricing built in from the start.",
    icon: FileText,
  },
  {
    id: "7",
    title: "Email Campaigns",
    description:
      "Send tracked outreach emails directly from RCRM via your own SMTP. Monitor opens, clicks, and replies — all tied to the right contact record.",
    icon: Mail,
  },
  {
    id: "8",
    title: "Analytics & Reports",
    description:
      "Real-time dashboards covering pipeline health, revenue forecasts, team activity, and lead conversion rates. No spreadsheet exports required.",
    icon: BarChart3,
  },
  {
    id: "9",
    title: "Integrations",
    description:
      "Connect your own SMTP provider, calendar, and more. RCRM is an open platform — built to fit into your existing workflow, not replace it.",
    icon: Plug,
  },
];
