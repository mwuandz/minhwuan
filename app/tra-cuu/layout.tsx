import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description: "Tra cứu trạng thái đơn hàng Minh Wuan Store",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
