import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { ExportOptions, Plan } from "@/types/calendar";
import { exportToICS, exportToCSV } from "@/lib/calendar/utils";
import { logger } from "@/lib/logger";

// POST /api/calendar/export - Export calendar in various formats
export async function POST(request: NextRequest) {
  try {
    const body: ExportOptions = await request.json();
    const { format, calendarId, userId, dateRange, pdfOptions } = body;

    if (!userId || !calendarId || !format) {
      return NextResponse.json(
        { error: "User ID, calendar ID, and format required" },
        { status: 400 }
      );
    }

    logger.info("Exporting calendar", { module: "calendar", action: "export", metadata: { calendarId, format } });

    // Fetch calendar
    const calendarDoc = await db
      .collection(`marketing/calendar/users/${userId}/calendars`)
      .doc(calendarId)
      .get();

    if (!calendarDoc.exists) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    const calendar = calendarDoc.data();
    const calendarName = calendar?.name || "Calendar";

    // Fetch plans
    let query = db
      .collection(`marketing/calendar/users/${userId}/plans`)
      .where("calendarId", "==", calendarId);

    if (dateRange) {
      query = query
        .where("start", ">=", new Date(dateRange.start))
        .where("start", "<=", new Date(dateRange.end)) as any;
    }

    const snapshot = await query.get();

    const plans: Plan[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      plans.push({
        id: doc.id,
        ...data,
        start: data.start?.toDate() || new Date(),
        end: data.end?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Plan);
    });

    // Sort by start date in memory
    plans.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    logger.debug("Exporting plans", { module: "calendar", action: "export", metadata: { calendarId, count: plans.length } });

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case "ics":
        content = exportToICS(plans, calendarName);
        filename = `${calendarName.replace(/\s+/g, "_")}.ics`;
        contentType = "text/calendar";
        break;

      case "csv":
        content = exportToCSV(plans);
        filename = `${calendarName.replace(/\s+/g, "_")}.csv`;
        contentType = "text/csv";
        break;

      case "json":
        content = JSON.stringify(
          {
            calendar: {
              id: calendarId,
              name: calendarName,
              ...calendar,
            },
            plans,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
        filename = `${calendarName.replace(/\s+/g, "_")}.json`;
        contentType = "application/json";
        break;

      case "pdf":
        // PDF generation will be handled client-side using jspdf
        // Return the data needed for PDF generation
        return NextResponse.json({
          calendar: {
            id: calendarId,
            name: calendarName,
            ...calendar,
          },
          plans,
          pdfOptions,
        });

      default:
        return NextResponse.json(
          { error: "Invalid format" },
          { status: 400 }
        );
    }

    logger.info("Export complete", { module: "calendar", action: "export", metadata: { calendarId, format, filename } });

    return NextResponse.json({
      content,
      filename,
      contentType,
    });
  } catch (error) {
    logger.error("Error exporting calendar", { module: "calendar", action: "export", error });
    return NextResponse.json(
      { error: "Failed to export calendar" },
      { status: 500 }
    );
  }
}
