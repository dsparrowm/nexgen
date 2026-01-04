import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "NexGen Crypto Mining - Investment Platform",
  description: "Invest in professional crypto mining operations with NexGen. Earn daily returns from Bitcoin, Ethereum, and altcoin mining pools. Secure, transparent, and profitable crypto investments.",
  keywords: "crypto mining, bitcoin mining, ethereum mining, crypto investment, passive income, blockchain mining, cryptocurrency",
  authors: [{ name: "NexGen Team" }],
  creator: "NexGen Crypto Mining",
  publisher: "NexGen Investment Platform",
  icons: {
    icon: "/newLogo.png",
    shortcut: "/newLogo.png",
    apple: "/newLogo.png",
  },
  openGraph: {
    title: "NexGen Crypto Mining - Investment Platform",
    description: "Invest in professional crypto mining operations with NexGen. Earn daily returns from Bitcoin, Ethereum, and altcoin mining pools.",
    type: "website",
    siteName: "NexGen Crypto Mining",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexGen Crypto Mining - Investment Platform",
    description: "Invest in professional crypto mining operations with NexGen. Earn daily returns from Bitcoin, Ethereum, and altcoin mining pools.",
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
        {children}
        <Toaster position="top-right" richColors />
        <script src="//code.tidio.co/kjoq3614ehzzyczrpszkhgqqo4j8tgp8.js" async></script>
      </body>
    </html>
  );
}
