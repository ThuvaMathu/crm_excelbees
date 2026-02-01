import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Contact } from "@/types/email-campaigns";
import { Timestamp } from "firebase-admin/firestore";

// POST /api/marketing/campaigns/audiences/crm-sync - Sync contacts from CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, filters } = body as {
      userId: string;
      filters?: {
        status?: string;
        tags?: string[];
        location?: string;
      };
    };

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Fetch leads from CRM (root collection filtering by ownerId)
    let query = adminDb.collection("leads").where("ownerId", "==", userId) as any;

    // Apply filters
    if (filters?.status) {
      query = query.where("status", "==", filters.status) as any;
    }

    const snapshot = await query.get();
    const contacts: Contact[] = [];

    snapshot.forEach((doc) => {
      const lead = doc.data();
      
      // Convert CRM lead to email contact
      if (lead.email) {
        contacts.push({
          id: doc.id,
          email: lead.email,
          firstName: lead.firstName || lead.name?.split(" ")[0],
          lastName: lead.lastName || lead.name?.split(" ").slice(1).join(" "),
          company: lead.company,
          tags: lead.tags || [],
          customFields: {
            phone: lead.phone,
            location: lead.location,
            status: lead.status,
          },
          subscribed: true,
          bounced: false,
          complained: false,
          totalOpens: 0,
          totalClicks: 0,
          source: "crm",
          crmLeadId: doc.id,
          subscribedAt: lead.createdAt || Timestamp.now(),
        });
      }
    });

    return NextResponse.json({
      contacts,
      total: contacts.length,
      message: `Synced ${contacts.length} contacts from CRM`,
    });
  } catch (error: any) {
    console.error("Error syncing CRM contacts:", error);
    return NextResponse.json(
      { error: "Failed to sync CRM contacts", message: error.message },
      { status: 500 }
    );
  }
}
