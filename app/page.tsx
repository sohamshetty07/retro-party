'use client';

import { SessionProvider } from "next-auth/react";
import HostDashboard from "@/components/HostDashboard";

export default function Home() {
  return (
    <SessionProvider>
      <HostDashboard />
    </SessionProvider>
  );
}