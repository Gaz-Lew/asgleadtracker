import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Management System",
  description: "A web application for managing sales leads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 font-sans">{children}</body>
    </html>
  );
}