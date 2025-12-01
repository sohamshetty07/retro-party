import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';

export async function GET(request, { params }) {
  // --- CRITICAL FIX FOR NEXT.JS 15 ---
  // You must await params before accessing the ID
  const { id } = await params; 
  
  console.log(`🔍 API: Searching for event ID: ${id}`);

  try {
    await dbConnect();
    const event = await Event.findOne({ eventId: id });
  
    if (!event) {
      console.log("❌ API: Event not found in DB");
      return NextResponse.json({ success: false, error: "Not Found" }, { status: 404 });
    }

    console.log("✅ API: Found event. Drive Link is:", event.driveLink);

    return NextResponse.json({ 
        success: true, 
        driveLink: event.driveLink, 
        eventName: event.eventName 
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}