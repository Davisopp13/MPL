import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPL - Manual Process Log",
  description:
    "Track time spent on manual processes. Fast, mobile-friendly time logging for CH and MH teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
