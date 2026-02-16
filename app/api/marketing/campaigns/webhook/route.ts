import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * POST /api/marketing/campaigns/webhook
 * Handle email provider webhooks for delivery events
 * Supports: SendGrid, Mailgun, AWS SES, Postmark
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let events: EmailEvent[] = [];

    // Parse based on content type and provider
    if (contentType.includes("application/json")) {
      const body = await request.json();
      events = parseWebhookEvents(body, request.headers);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const body: Record<string, any> = {};
      formData.forEach((value, key) => {
        body[key] = value;
      });
      events = parseWebhookEvents(body, request.headers);
    }

    if (events.length === 0) {
      return NextResponse.json({ received: true, eventsProcessed: 0 });
    }

    // Process events in batches
    const batch = adminDb.batch();
    let processedCount = 0;

    for (const event of events) {
      if (event.campaignId && event.contactId) {
        const eventRef = adminDb
          .collection(`marketing/email-campaigns/events`)
          .doc();

        batch.set(eventRef, {
          ...event,
          createdAt: Timestamp.now(),
        });

        // Update contact status if bounced/complained
        if ((event.eventType === "bounced" || event.eventType === "complained") && event.userId && event.contactId) {
          await updateContactStatus(event.userId, event.contactId, event);
        }

        processedCount++;
      }
    }

    await batch.commit();

    // Update campaign stats
    for (const event of events) {
      if (event.campaignId) {
        updateCampaignStats(event.campaignId, event.eventType).catch((err) =>
          console.error("Failed to update campaign stats:", err)
        );
      }
    }

    return NextResponse.json({
      received: true,
      eventsProcessed: processedCount,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook", message: errorMessage },
      { status: 500 }
    );
  }
}

interface EmailEvent {
  campaignId?: string;
  contactId?: string;
  userId?: string;
  eventType: "delivered" | "bounced" | "complained" | "unsubscribed" | "rejected";
  timestamp?: Timestamp;
  metadata?: Record<string, any>;
  email?: string;
}

/**
 * Parse webhook events based on provider
 */
function parseWebhookEvents(
  body: any,
  headers: Headers
): EmailEvent[] {
  const signature = headers.get("x-webhook-signature") || "";
  const provider = detectProvider(body, headers);

  switch (provider) {
    case "sendgrid":
      return parseSendGridEvents(body);
    case "mailgun":
      return parseMailgunEvents(body);
    case "ses":
      return parseSESEvents(body);
    case "postmark":
      return parsePostmarkEvents(body);
    default:
      console.warn("Unknown webhook provider:", provider);
      return [];
  }
}

function detectProvider(body: any, headers: Headers): string {
  // SendGrid
  if (Array.isArray(body) && body[0]?.["sg-event-id"]) {
    return "sendgrid";
  }
  // Mailgun
  if (body["signature"] && body["event-data"]) {
    return "mailgun";
  }
  // AWS SES
  if (body["Type"] === "Notification" && body["Message"]) {
    return "ses";
  }
  // Postmark
  if (Array.isArray(body) && body[0]?.["MessageID"]) {
    return "postmark";
  }
  return "unknown";
}

function parseSendGridEvents(events: any[]): EmailEvent[] {
  return events.map((event) => {
    const eventType = mapEventType(event["event"]);
    return {
      campaignId: event["custom_args"]?.campaignId || "",
      contactId: event["custom_args"]?.contactId || "",
      userId: event["custom_args"]?.userId || "",
      email: event["email"],
      eventType,
      metadata: {
        reason: event["reason"],
        status: event["status"],
        sgEventId: event["sg-event-id"],
        sgMessageId: event["sg-message-id"],
      },
    };
  });
}

function parseMailgunEvents(body: any): EmailEvent[] {
  const eventData = body["event-data"];
  const signature = body["signature"];

  return [{
    campaignId: eventData["custom-vars"]?.campaignId || "",
    contactId: eventData["custom-vars"]?.contactId || "",
    userId: eventData["custom-vars"]?.userId || "",
    email: eventData["recipient"],
    eventType: mapEventType(eventData["event"]),
    timestamp: eventData["timestamp"]
      ? Timestamp.fromDate(new Date(eventData["timestamp"] * 1000))
      : Timestamp.now(),
    metadata: {
      reason: eventData["reason"],
      deliveryStatus: eventData["delivery-status"],
      code: eventData["code"],
    },
  }];
}

function parseSESEvents(body: any): EmailEvent[] {
  try {
    const message = JSON.parse(body["Message"]);
    const eventType = mapEventType(message["eventType"]);

    return [{
      campaignId: message["mail"]?.["customArgs"]?.campaignId || "",
      contactId: message["mail"]?.["customArgs"]?.contactId || "",
      userId: message["mail"]?.["customArgs"]?.userId || "",
      email: message["mail"]?.["destination"]?.[0],
      eventType,
      metadata: {
        processingTimeMillis: message["processingTimeMillis"],
        reportingMTA: message["reportingMTA"],
        diagnosticCode: message["bounce"]?.["diagnosticCode"],
      },
    }];
  } catch {
    return [];
  }
}

function parsePostmarkEvents(events: any[]): EmailEvent[] {
  return events.map((event) => {
    const eventType = mapEventType(event["Event"]);
    return {
      campaignId: event["Metadata"]?.CampaignId || "",
      contactId: event["Metadata"]?.ContactId || "",
      userId: event["Metadata"]?.UserId || "",
      email: event["Recipient"],
      eventType,
      metadata: {
        details: event["Details"],
        tag: event["Tag"],
      },
    };
  });
}

function mapEventType(eventType: string): EmailEvent["eventType"] {
  const typeMap: Record<string, EmailEvent["eventType"]> = {
    delivered: "delivered",
    bounce: "bounced",
    bounced: "bounced",
    spamreport: "complained",
    complained: "complained",
    unsubscribe: "unsubscribed",
    unsubscribed: "unsubscribed",
    rejected: "rejected",
    drop: "rejected",
    Delivery: "delivered",
    Bounce: "bounced",
    Complaint: "complained",
    Reject: "rejected",
  };

  return typeMap[eventType] || "delivered";
}

async function updateContactStatus(
  userId: string,
  contactId: string,
  event: EmailEvent
) {
  if (!userId) return;

  try {
    const updateData: Record<string, any> = {};

    if (event.eventType === "bounced") {
      updateData.bounced = true;
      updateData.subscribed = false;
      updateData.bouncedAt = Timestamp.now();
    }

    if (event.eventType === "complained") {
      updateData.complained = true;
      updateData.subscribed = false;
      updateData.complainedAt = Timestamp.now();
    }

    if (event.eventType === "unsubscribed") {
      updateData.subscribed = false;
      updateData.unsubscribedAt = Timestamp.now();
    }

    if (Object.keys(updateData).length > 0) {
      await adminDb
        .doc(`marketing/email-campaigns/users/${userId}/contacts/${contactId}`)
        .update(updateData);
    }
  } catch (error) {
    console.error("Failed to update contact status:", error);
  }
}

async function updateCampaignStats(
  campaignId: string,
  eventType: EmailEvent["eventType"]
) {
  console.log(`Stats update needed for campaign ${campaignId}: ${eventType}`);
}
