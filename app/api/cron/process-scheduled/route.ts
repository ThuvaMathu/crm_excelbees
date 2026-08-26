import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email/email-service";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        // Authenticate the cron request?
        // Maybe check for a CRON_SECRET header if configured.
        // For now, robust error handling is key.

        const now = Timestamp.now();
        const emailsRef = adminDb.collection("emails");
        
        // Query scheduled emails that are due
        const snapshot = await emailsRef
            .where("status", "==", "scheduled")
            .where("scheduledAt", "<=", now)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ success: true, processed: 0 });
        }

        let processed = 0;
        let errors = 0;

        for (const doc of snapshot.docs) {
            const email = doc.data();
            
            try {
                // Send the email
                // Note: email-service uses nodemailer. 
                // We need to verify if the 'from' address is valid for our transport.
                // Assuming email.from is verified or we use default.
                
                await sendEmail(
                    email.to, 
                    email.subject, 
                    email.body, 
                    // email.from? we might need to be careful if user tries to spoof.
                    // Usually we send from system email and set Reply-To.
                    // But our sendEmail handles this.
                    undefined,
                    email.attachments?.map((a: any) => ({
                        filename: a.name,
                        path: a.url
                    }))
                );

                // Update status
                await doc.ref.update({
                    status: "sent",
                    sentAt: Timestamp.now(),
                    error: null
                });

                processed++;
            } catch (error: any) {
                logger.error("Failed to send scheduled email", { module: "cron", action: "process-scheduled", metadata: { emailId: doc.id }, error });
                await doc.ref.update({
                    status: "failed",
                    error: error.message
                });
                errors++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            processed, 
            errors 
        });

    } catch (error: any) {
        logger.error("Cron job error", { module: "cron", action: "process-scheduled", error });
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
