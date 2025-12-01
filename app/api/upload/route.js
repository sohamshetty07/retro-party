import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import { Readable } from 'stream';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const eventId = formData.get('eventId');
    const caption = formData.get('caption');

    if (!file || !eventId) {
      return NextResponse.json({ success: false, error: "Missing file or eventId" }, { status: 400 });
    }

    // 1. Find the Event in Database
    await dbConnect();
    const event = await Event.findOne({ eventId });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // 2. Authenticate as the Host
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    auth.setCredentials({ refresh_token: event.refreshToken });
    const drive = google.drive({ version: 'v3', auth });

    // 3. Prepare the File Stream
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // Signal end of stream

    // 4. Upload to Google Drive
    // We put it inside the specific 'driveFolderId' we saved during event creation
    const safeCaption = (caption || 'photo').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const filename = `${safeCaption}_${Date.now()}.jpg`;

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [event.driveFolderId], // <--- This puts it in the correct folder!
      },
      media: {
        mimeType: 'image/jpeg',
        body: stream,
      },
    });

    console.log(`✅ Uploaded to Drive: ${response.data.id}`);

    return NextResponse.json({ success: true, fileId: response.data.id });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}