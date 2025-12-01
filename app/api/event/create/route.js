import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.refreshToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventName } = body;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: session.refreshToken });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Create Folder
    const fileMetadata = {
      name: `RetroCam - ${eventName}`,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, webViewLink', // <--- Request the Link
    });

    const folderId = driveResponse.data.id;
    const publicLink = driveResponse.data.webViewLink;

    // 2. MAKE IT PUBLIC (Reader permission for anyone with link)
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 3. Save to DB
    await dbConnect();
    const shortId = `party-${Math.random().toString(36).substr(2, 5)}`;

    const newEvent = await Event.create({
        eventId: shortId,
        hostEmail: session.user.email,
        refreshToken: session.refreshToken,
        driveFolderId: folderId,
        driveLink: publicLink, // <--- Saving the link
        eventName: eventName
    });

    return NextResponse.json({ success: true, event: newEvent });

  } catch (error) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}