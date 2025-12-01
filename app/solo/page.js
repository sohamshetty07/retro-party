import RetroCamera from '@/components/RetroCamera';

export default function SoloPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* No eventId passed, so it runs in Single Player mode */}
      <RetroCamera />
    </main>
  );
}