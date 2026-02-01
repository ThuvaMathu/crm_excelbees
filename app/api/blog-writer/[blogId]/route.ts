import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ blogId: string }> }
) {
  const params = await props.params;
  try {
    const blogId = params.blogId;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const path = `marketing/blog-writer/users/${userId}/blogs`;
    console.log(`🔍 Fetching blog ${blogId} from ${path}`);

    const blogDoc = await db
      .collection(path)
      .doc(blogId)
      .get();

    if (!blogDoc.exists) {
      console.warn(`❌ Blog not found: ${blogId} in ${path}`);
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blog = {
      id: blogDoc.id,
      ...blogDoc.data(),
      createdAt: blogDoc.data()?.createdAt?.toDate?.() || new Date(),
      updatedAt: blogDoc.data()?.updatedAt?.toDate?.() || new Date(),
    };

    console.log(`✅ Blog found: ${blog.id}`);
    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ blogId: string }> }
) {
  const params = await props.params;
  try {
    const blogId = params.blogId;
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ blogId: string }> }
) {
  const params = await props.params;
  try {
    const blogId = params.blogId;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await db
      .collection(`marketing/blog-writer/users/${userId}/blogs`)
      .doc(blogId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
