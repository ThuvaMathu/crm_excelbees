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
    businessType: "Trades & Construction",
    role: "Operations Manager",
    quote:
      "We switched from Salesforce and cut our CRM bill by over $400 a month. The Quotes module alone paid for the switch — we went from emailing Word docs to sending branded quotes in under 30 seconds.",
    rating: 5,
    initials: "JM",
  },
  {
    id: "2",
    name: "Sarah Chen",
    businessType: "Tech Consultancy",
    role: "Sales Director",
    quote:
      "The AI assistant saves me close to two hours every day. New leads get enriched automatically, follow-up emails are drafted before I even open the record, and the pipeline view keeps the whole team aligned.",
    rating: 5,
    initials: "SC",
  },
  {
    id: "3",
    name: "Michael Torres",
    businessType: "Independent Retail",
    role: "Business Owner",
    quote:
      "I run projects, invoices, and client contacts in one place now. The setup took half a morning. My accountant loves the GST-inclusive invoices and I haven't touched a spreadsheet since.",
    rating: 5,
    initials: "MT",
  },
];
