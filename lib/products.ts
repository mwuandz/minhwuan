import { Product } from "./types";

export const products: Product[] = [
  {
    id: "chatgpt-plus-1m",
    name: "ChatGPT Plus 1 tháng",
    category: "AI",
    price: 99000,
    duration: "1 tháng",
    description: "Gói AI hỗ trợ học tập, viết nội dung, code và xử lý công việc nhanh hơn.",
    deliveryType: "manual"
  },
  {
    id: "gemini-advanced-1m",
    name: "Gemini Advanced 1 tháng",
    category: "AI",
    price: 79000,
    duration: "1 tháng",
    description: "Phù hợp tra cứu, học tập, sáng tạo nội dung và làm việc với tài liệu.",
    deliveryType: "manual"
  },
  {
    id: "capcut-pro-1m",
    name: "CapCut Pro 1 tháng",
    category: "Video/Photo",
    price: 99000,
    duration: "1 tháng",
    description: "Mở khóa hiệu ứng, template, công cụ dựng video và chỉnh sửa nội dung ngắn.",
    deliveryType: "manual"
  },
  {
    id: "canva-pro-12m",
    name: "Canva Pro 12 tháng",
    category: "Video/Photo",
    price: 299000,
    duration: "12 tháng",
    description: "Thiết kế poster, banner, CV, thumbnail, bài đăng mạng xã hội nhanh chóng.",
    deliveryType: "manual"
  },
  {
    id: "youtube-premium-12m",
    name: "YouTube Premium 12 tháng",
    category: "Giải trí",
    price: 419000,
    duration: "12 tháng",
    description: "Xem YouTube không quảng cáo, nghe nhạc nền và trải nghiệm mượt hơn.",
    deliveryType: "manual"
  },
  {
    id: "spotify-premium-12m",
    name: "Spotify Premium 12 tháng",
    category: "Giải trí",
    price: 299000,
    duration: "12 tháng",
    description: "Nghe nhạc chất lượng cao, bỏ qua bài hát và tải playlist nghe offline.",
    deliveryType: "manual"
  },
  {
    id: "netflix-1m",
    name: "Netflix Premium 1 tháng",
    category: "Giải trí",
    price: 89000,
    duration: "1 tháng",
    description: "Gói giải trí xem phim, series, anime và nội dung hot theo nhu cầu.",
    deliveryType: "manual"
  },
  {
    id: "combo-ai-content",
    name: "Combo AI Content",
    category: "ComboApp",
    price: 149000,
    duration: "1 tháng",
    description: "Combo app AI phục vụ học tập, sáng tạo nội dung, hình ảnh và video.",
    deliveryType: "manual"
  }
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}
