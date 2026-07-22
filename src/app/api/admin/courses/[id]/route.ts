import { NextRequest, NextResponse } from 'next/server';
import { MOCK_COURSES } from '@/lib/mockDb';

// DELETE a course
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const index = MOCK_COURSES.findIndex(c => c.id === id);
    if (index !== -1) MOCK_COURSES.splice(index, 1);
    
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

    const index = MOCK_COURSES.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    MOCK_COURSES[index] = {
      ...MOCK_COURSES[index],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: MOCK_COURSES[index] });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to update course' }, { status: 500 });
  }
}
