import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MinhWuan Store",
  description: "Digital Premium Service"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
