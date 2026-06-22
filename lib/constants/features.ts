import { Shield, Bot, Puzzle, TrendingUp, FileText, DollarSign } from "lucide-react";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export const features: Feature[] = [
  {
    id: "1",
    title: "Role-Based Access",
    description:
      "Control who sees what with Admin, Manager, and Team member roles. Secure, flexible permissions for teams of any size.",
    icon: Shield,
  },
  {
    id: "2",
    title: "Custom AI Assistant",
    description:
      "Automate data entry, generate insights, and save hours every week. AI learns your business patterns.",
    icon: Bot,
  },
  {
    id: "3",
    title: "Modular Features",
    description:
      "Pick only what you need. No bloat. Pay only for active modules. Scale as your business grows.",
    icon: Puzzle,
  },
  {
    id: "4",
    title: "Lead & Deal Tracking",
    description:
      "Visual pipeline management. Track deals from prospect to close. Never miss a follow-up again.",
    icon: TrendingUp,
  },
  {
    id: "5",
    title: "Invoice & Billing",
    description:
      "Built-in invoicing, recurring billing, and payment reminders. Get paid faster.",
    icon: FileText,
  },
  {
    id: "6",
    title: "Affordable Pricing",
    description:
      "Transparent, no-surprise pricing. Start small, pay as you grow. No enterprise contracts required.",
    icon: DollarSign,
  },
];
