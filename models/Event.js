import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true }, // e.g., "party-xmas"
  hostEmail: { type: String, required: true },
  refreshToken: { type: String, required: true }, // The Key to their Drive
  driveFolderId: { type: String, required: true }, // Where photos go
  driveLink: { type: String },
  eventName: String,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);