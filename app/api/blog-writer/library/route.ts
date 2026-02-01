import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const status = request.nextUrl.searchParams.get("status");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    console.log(`📚 Fetching library for user: ${userId}`);
    let query = db.collection(`marketing/blog-writer/users/${userId}/blogs`);

    if (status) {
      query = query.where("status", "==", status) as any;
    }

    const snapshot = await query.get();
    console.log(`📚 Found ${snapshot.size} blogs`);

    const blogs = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        
        // Helper to safely convert to Date
        const toDate = (val: any) => {
          if (!val) return new Date();
          if (val.toDate && typeof val.toDate === 'function') return val.toDate();
          if (val instanceof Date) return val;
          if (typeof val === 'string') return new Date(val);
          return new Date();
        };

        return {
          id: doc.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          actualWordCount: data.actualWordCount || 0,
          seoScore: data.seoScore || 0,
          status: data.status || 'draft',
          title: data.title || 'Untitled',
        };
      })
      .sort((a, b) => {
        const timeA = a.createdAt.getTime();
        const timeB = b.createdAt.getTime();
        return timeB - timeA;
      });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("❌ Error fetching blog library:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
