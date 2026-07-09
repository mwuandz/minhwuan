import { Product } from "./types";

export const products: Product[] = [
  {
    id: "youtube-premium-12m",
    name: "YouTube Premium 12 tháng",
    category: "Giải trí",
    price: 419000,
    duration: "12 tháng",
    description: "Gói premium hỗ trợ kích hoạt nhanh, bảo hành rõ ràng.",
    deliveryType: "manual"
  },
  {
    id: "canva-pro-12m",
    name: "Canva Pro 12 tháng",
    category: "Thiết kế",
    price: 299000,
    duration: "12 tháng",
    description: "Phù hợp làm poster, banner, CV, nội dung mạng xã hội.",
    deliveryType: "manual"
  },
  {
    id: "capcut-pro-1m",
    name: "CapCut Pro 1 tháng",
    category: "Video",
    price: 99000,
    duration: "1 tháng",
    description: "Dành cho dựng video ngắn, template, hiệu ứng pro.",
    deliveryType: "manual"
  },
  {
    id: "sample-resource-pack",
    name: "Gói tài nguyên mẫu",
    category: "Tài nguyên số",
    price: 49000,
    duration: "Vĩnh viễn",
    description: "Sản phẩm demo giao tự động sau khi thanh toán.",
    deliveryType: "auto",
    stock: ["Link tải demo: https://example.com/resource-pack"]
  }
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}
