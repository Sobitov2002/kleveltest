import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kleveltest by Dinakorean — Koreys tilini tinglab o‘rganing",
  description: "Koreyscha jumlalarni tinglang, yozing va natijalaringizni kuzatib boring.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
