export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  initials: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
  };
}

export const team: TeamMember[] = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Founder & CTO",
    bio: "10+ years in SaaS. Built ExcelBees to solve real business problems.",
    initials: "AJ",
    socialLinks: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "2",
    name: "Emma Williams",
    role: "Product Lead",
    bio: "Passionate about user-centered design. Ensures RCRM is intuitive and powerful.",
    initials: "EW",
    socialLinks: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "3",
    name: "David Chen",
    role: "Lead Engineer",
    bio: "Full-stack developer. Crafts robust, scalable infrastructure for growing businesses.",
    initials: "DC",
    socialLinks: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    id: "4",
    name: "Lisa Patel",
    role: "Business Development",
    bio: "Connects RCRM with growing businesses. Listens to customer needs daily.",
    initials: "LP",
    socialLinks: {
      linkedin: "#",
      twitter: "#",
    },
  },
];
