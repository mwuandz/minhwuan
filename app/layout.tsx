import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minh Wuan Store - Bảng giá App Pro/Premium",
  description: "Mua App Pro/Premium, combo AI, video/photo, giải trí, voucher và thanh toán VietQR tự động tại minhwuan.com"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
