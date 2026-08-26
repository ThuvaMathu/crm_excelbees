export async function randomEmail(): Promise<string> {
  const id = Math.random().toString(36).substring(2, 10);
  return `test.${id}@playwright.test`;
}

export async function randomName(): Promise<string> {
  const id = Math.random().toString(36).substring(2, 8);
  return `Test ${id}`;
}

export async function randomCompanyName(): Promise<string> {
  const id = Math.random().toString(36).substring(2, 6);
  return `Acme ${id.toUpperCase()}`;
}

export async function randomPhone(): Promise<string> {
  const area = Math.floor(Math.random() * 800) + 200;
  const prefix = Math.floor(Math.random() * 800) + 200;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `+1${area}${prefix}${line}`;
}

export async function randomDealTitle(): Promise<string> {
  const adjectives = ["Enterprise", "Strategic", "Premium", "Standard", "Custom"];
  const nouns = ["License", "Subscription", "Package", "Solution", "Plan"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun} ${Math.floor(Math.random() * 900) + 100}`;
}

export async function randomNotes(count = 2): Promise<string> {
  const sentences = [
    "Spoke with the client about their requirements.",
    "Follow-up meeting scheduled for next week.",
    "Client is interested in the premium plan.",
    "Sent proposal for review.",
    "Need to prepare demo for the team.",
    "Budget approved by the finance department.",
    "Client requested additional features.",
    "Contract is under legal review.",
  ];
  return sentences.sort(() => Math.random() - 0.5).slice(0, count).join(" ");
}