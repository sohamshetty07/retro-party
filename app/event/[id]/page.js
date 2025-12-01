// app/event/[id]/page.js
'use client'; // Important for unwrapping params in client components

import { use } from 'react'; // New hook for Next.js 15
import RetroCamera from '@/components/RetroCamera';

export default function PartyPage({ params }) {
  // Unwrap the params using React.use()
  const resolvedParams = use(params);
  
  return (
    <main className="min-h-screen bg-black">
      <RetroCamera eventId={resolvedParams.id} />
    </main>
  );
}