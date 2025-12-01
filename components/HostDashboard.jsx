'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react"; // We will install this next
import { Copy, LogOut, Plus, Loader2, Camera, ExternalLink } from "lucide-react";

export default function HostDashboard() {
  const { data: session } = useSession();
  const [eventName, setEventName] = useState("");
  const [createdEvent, setCreatedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call our new API route (we will build this next)
      const res = await fetch("/api/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            eventName,
            hostEmail: session.user.email 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedEvent(data.event);
      } else {
        alert("Failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating event");
    } finally {
      setIsLoading(false);
    }
  };

  // --- VIEW 1: NOT LOGGED IN (Updated with Solo Mode) ---
  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center gap-6">
        <div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">RETRO<span className="text-red-500">CAM</span></h1>
            <p className="text-neutral-400 font-mono">The digital disposable camera.</p>
        </div>
        
        {/* PARTY MODE BUTTON */}
        <button 
          onClick={() => signIn("google")}
          className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors w-full max-w-xs justify-center"
        >
          <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
          Host a Party
        </button>

        <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-white/30 text-xs font-bold">OR</span>
            <div className="h-px bg-white/20 flex-1"></div>
        </div>

        {/* SOLO MODE BUTTON */}
        <a 
          href="/solo" 
          className="border-2 border-white/20 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/10 transition-colors w-full max-w-xs justify-center"
        >
          <Camera size={20} />
          Use Camera Solo
        </a>
      </div>
    );
  }

  // --- VIEW 2: EVENT CREATED (QR CODE) ---
  if (createdEvent) {
    const shareUrl = `${window.location.origin}/event/${createdEvent.eventId}`;
    
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black mb-1">{createdEvent.eventName}</h2>
            <p className="text-neutral-500 text-sm">Event ID: {createdEvent.eventId}</p>
          </div>

          <div className="bg-white border-4 border-black p-4 rounded-xl inline-block mb-6">
            <QRCodeSVG value={shareUrl} size={200} />
          </div>

          <p className="text-sm text-neutral-600 mb-6 font-mono">Scan to join the party camera</p>

          <div className="flex flex-col gap-3">
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Copied!");
                }}
                className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800"
            >
                <Copy size={18} /> Copy Link
            </button>
            <a 
                href={shareUrl}
                target="_blank"
                className="w-full border-2 border-black text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-100"
            >
                <ExternalLink size={18} /> Open Camera
            </a>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="mt-8 text-neutral-500 hover:text-white underline">Start Another Event</button>
      </div>
    );
  }

  // --- VIEW 3: CREATE EVENT FORM ---
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    {session.user.image && <img src={session.user.image} className="w-10 h-10 rounded-full border border-neutral-700" />}
                    <div className="text-left">
                        <p className="text-white font-bold text-sm">Host Console</p>
                        <p className="text-neutral-500 text-xs">{session.user.email}</p>
                    </div>
                </div>
                <button onClick={() => signOut()} className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-white"><LogOut size={16}/></button>
            </div>

            <form onSubmit={handleCreateEvent} className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <label className="block text-neutral-400 text-xs font-bold uppercase mb-2 ml-1">Event Name</label>
                <input 
                    type="text" 
                    required
                    placeholder="e.g. Christmas Party 2025"
                    className="w-full bg-black text-white p-4 rounded-xl border border-neutral-800 focus:border-blue-500 focus:outline-none mb-6 text-lg placeholder-neutral-700"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                />
                
                <button 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> Create Event</>}
                </button>
            </form>
            
            <div className="mt-8 text-center">
                <p className="text-neutral-600 text-xs">
                    Photos will be saved to a folder named "RetroCam" in your Google Drive.
                </p>
            </div>
        </div>
    </div>
  );
}