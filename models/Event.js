import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  hostEmail: { type: String, required: true },
  refreshToken: { type: String, required: true },
  driveFolderId: { type: String, required: true },
  driveLink: { type: String },
  eventName: String,
  
  // 1. Add "createdAt" if you haven't already
  createdAt: { type: Date, default: Date.now },
});

// 2. THIS IS THE MAGIC LINE
// It tells MongoDB: "Look at the 'createdAt' field. 
// If it is older than 86400 seconds (24 hours), DELETE this document."
// You can change 86400 to however many seconds you want (e.g., 604800 for 1 week).
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); 

export default mongoose.models.Event || mongoose.model('Event', EventSchema);