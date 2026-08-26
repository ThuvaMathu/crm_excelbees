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
    name: "Thuvarakan",
    role: "Founder & Full-Stack Developer",
    bio: "Thuvarakan is the founder of ExcelBees and a full-stack developer with 5+ years of experience building web applications and leading digital strategy for Australian businesses. Based in Brisbane, QLD, he specialises in Next.js, SEO architecture, and performance-optimised web design.",
    initials: "TK",
    socialLinks: {
      linkedin: "https://www.linkedin.com/company/excelbees/",
    },
  },
  {
    id: "2",
    name: "Alester",
    role: "IT Consultant",
    bio: "Alester is an experienced IT consultant with 3+ years in networking and field support. He brings hands-on expertise in IT infrastructure, troubleshooting complex network environments, and delivering reliable technical support to clients across a range of industries.",
    initials: "AL",
    socialLinks: {
      linkedin: "#",
    },
  },
  {
    id: "3",
    name: "Alavandhan",
    role: "Full-Stack & Cloud Engineering",
    bio: "Alavandhan is a full-stack engineer and AI engineer specialising in Next.js, FastAPI, and agentic AI systems. He focuses on building cloud-native applications and scalable architecture, bridging secure cloud-deployed backends with high-performance user interfaces.",
    initials: "AV",
    socialLinks: {
      linkedin: "#",
    },
  },
  {
    id: "4",
    name: "Agilesh",
    role: "Full-Stack & SEO",
    bio: "Agilesh is a full-stack engineer and SEO specialist who combines technical development with search engine optimisation. He builds performant web applications and implements data-driven SEO strategies to help businesses grow their organic presence.",
    initials: "AG",
    socialLinks: {
      linkedin: "#",
    },
  },
  {
    id: "5",
    name: "Gokulan",
    role: "Graphic Designer",
    bio: "Gokulan is a graphic designer with two Master's degrees in Business Administration and a passion for visual storytelling. His unique blend of business acumen and creative talent means every design he produces is not just visually compelling but strategically effective.",
    initials: "GK",
    socialLinks: {
      linkedin: "#",
    },
  },
];
