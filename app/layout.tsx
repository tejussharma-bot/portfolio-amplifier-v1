import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import { AuthProvider } from "@/components/providers/auth-provider";

import "./globals.css";

const manrope = Manrope({
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
    "Portfolio Amplifier turns work samples into case studies, channel-ready content, and reputation workflows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} [--font-label:var(--font-body)]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
