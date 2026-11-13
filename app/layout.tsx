import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEB — Adaptive Eye Balance",
  description: "A display experience that adapts to the way you read."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}