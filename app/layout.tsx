import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Scorer",
  description:
    "AI-powered design portfolio evaluation tool for recruiters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f9f9f8] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
