import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

// DELETE a course
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(courses).where(eq(courses.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete course' }, { status: 500 });
  }
}

// PUT update a course
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await db.update(courses)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to update course' }, { status: 500 });
  }
}
