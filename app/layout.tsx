import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/components/providers/auth-provider";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Portfolio Amplifier",
  description:
    "Portfolio Amplifier is an AI-assisted case study builder that turns project context into polished narratives and channel-ready publishing copy."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} [--font-label:var(--font-body)]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
