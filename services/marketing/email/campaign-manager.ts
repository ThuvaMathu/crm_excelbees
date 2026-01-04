import { AIProviderFactory } from "@/services/ai/provider-factory";
import { MarketingEmailCampaign } from "@/types/marketing";
import { Timestamp, addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export class EmailCampaignService {
  
  /**
   * Generate 3 catchy subject lines based on topic and audience
   */
  static async generateSubjectLines(topic: string, audience: string, userId: string, workspaceId: string): Promise<string[]> {
    const prompt = `
      Act as an Email Marketing Expert.
      Topic: "${topic}"
      Target Audience: "${audience}"
      
      Generate 3 high-converting, catchy email subject lines (under 50 chars).
      
      Output ONLY a JSON array of strings:
      ["Subject 1", "Subject 2", "Subject 3"]
    `;

    return AIProviderFactory.extractJson<string[]>(
      prompt,
      "See prompt",
      { topic, audience },
      { 
        feature: "email_campaign", 
        complexity: "creative",
        userId, 
        workspaceId 
      }
    );
  }

  /**
   * Generate email body content
   */
  static async generateEmailContent(topic: string, audience: string, tone: string, userId: string, workspaceId: string): Promise<string> {
    const prompt = `
      Write a marketing email body.
      Topic: "${topic}"
      Audience: "${audience}"
      Tone: "${tone}"
      
      Requirements:
      - Engaging opening hook.
      - Clear value proposition.
      - Strong Call to Action (CTA).
      - HTML format (simple, clean tags like <p>, <br>, <strong>).
    `;

    return AIProviderFactory.generate(
      prompt,
      { topic, audience, tone },
      {
        feature: "email_campaign",
        complexity: "creative",
        userId,
        workspaceId
      }
    );
  }

  /**
   * Create and Save Campaign Draft
   */
  static async saveCampaign(data: Partial<MarketingEmailCampaign>, workspaceId: string): Promise<string> {
     const cleanData = {
         ...data,
         status: "draft",
         workspaceId,
         recipientsCount: data.recipientsCount || 0,
         createdAt: Timestamp.now(),
         stats: { opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 }
     };
     
     const docRef = await addDoc(collection(db, "marketing_email_campaigns"), cleanData);
     return docRef.id;
  }

  /**
   * Simulate Sending
   */
  static async sendCampaign(campaignId: string): Promise<void> {
      // In a real app, this would queue a job for SendGrid/Resend
      console.log(`[Email Service] Sending campaign ${campaignId}...`);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      await updateDoc(doc(db, "marketing_email_campaigns", campaignId), {
          status: "completed",
          sentAt: Timestamp.now()
      });
  }
}
