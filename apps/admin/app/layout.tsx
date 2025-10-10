import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ToastContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "NexGen Crypto Mining - Admin Dashboard",
  description: "Comprehensive admin dashboard for NexGen Crypto Mining Platform. Manage users, investments, mining operations, and system analytics with advanced security features.",
  keywords: "crypto mining, admin dashboard, investment platform, blockchain, cryptocurrency",
  authors: [{ name: "NexGen Team" }],
  creator: "NexGen Crypto Mining",
  publisher: "NexGen Investment Platform",
  icons: {
    icon: "/newLogo.png",
    shortcut: "/newLogo.png",
    apple: "/newLogo.png",
  },
  openGraph: {
    title: "NexGen Crypto Mining - Admin Dashboard",
    description: "Comprehensive admin dashboard for NexGen Crypto Mining Platform",
    type: "website",
    siteName: "NexGen Admin Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexGen Crypto Mining - Admin Dashboard",
    description: "Comprehensive admin dashboard for NexGen Crypto Mining Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/newLogo.png" type="image/png" />
        <link rel="shortcut icon" href="/newLogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/newLogo.png" />
        <meta name="theme-color" content="#1a365d" />
        <meta name="msapplication-TileColor" content="#1a365d" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
