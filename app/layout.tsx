import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RetroCam | The Digital Disposable",
  description: "Host your own vintage photo booth. Photos save instantly to your Google Drive.",
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', rel: 'shortcut icon' }, // Fallback
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest', // Points to the file you put in /public
  appleWebApp: {
    title: "Retro Cam",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "RetroCam | The Digital Disposable",
    description: "Join the party camera. Snap vintage photos and upload instantly.",
    url: "https://retro-party.vercel.app", // Your Vercel URL
    siteName: "RetroCam",
    images: [
      {
        url: "/og-image.png", // Ensure this image exists in your /app folder (or /public)
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
