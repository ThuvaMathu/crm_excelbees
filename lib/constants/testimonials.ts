export interface Testimonial {
  id: string;
  name: string;
  businessType: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "James Mitchell",
    businessType: "Trades Company",
    role: "Operations Manager",
    quote:
      "We switched from Salesforce and instantly saved $400 a month. RCRM does everything we need without the bloat. Our team was productive on day one.",
    rating: 5,
    initials: "JM",
  },
  {
    id: "2",
    name: "Sarah Chen",
    businessType: "Tech Startup",
    role: "Sales Director",
    quote:
      "The AI data entry alone saves me 2 hours every day. No more manual CRM updates. Our pipeline visibility is crystal clear.",
    rating: 5,
    initials: "SC",
  },
  {
    id: "3",
    name: "Michael Torres",
    businessType: "Retail Business",
    role: "Business Owner",
    quote:
      "Finally, a CRM that doesn't overwhelm the team. Intuitive, affordable, and exactly what a growing business needs.",
    rating: 5,
    initials: "MT",
  },
];
