'use client';

import { SessionProvider } from "next-auth/react";
import HostDashboard from "@/components/HostDashboard";
import HowToUse from "@/components/HowToUse";

export default function Home() {
  return (
    <SessionProvider>
      {/* The Dashboard handles the main UI */}
      <HostDashboard />
      
      {/* The Help button floats on top of everything (fixed position) */}
      <HowToUse />
    </SessionProvider>
  );
}