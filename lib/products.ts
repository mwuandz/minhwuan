import { Product, SiteSettings } from "./types";

export const defaultProducts: Product[] = [
  {
    id: "chatgpt-plus-1m",
    name: "ChatGPT Plus 1 tháng",
    category: "AI",
    price: 99000,
    duration: "1 tháng",
    description: "Gói AI hỗ trợ học tập, viết nội dung, code và xử lý công việc nhanh hơn.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "gemini-advanced-1m",
    name: "Gemini Advanced 1 tháng",
    category: "AI",
    price: 79000,
    duration: "1 tháng",
    description: "Phù hợp tra cứu, học tập, sáng tạo nội dung và làm việc với tài liệu.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "capcut-pro-1m",
    name: "CapCut Pro 1 tháng",
    category: "Video/Photo",
    price: 99000,
    duration: "1 tháng",
    description: "Mở khóa hiệu ứng, template, công cụ dựng video và chỉnh sửa nội dung ngắn.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "canva-pro-12m",
    name: "Canva Pro 12 tháng",
    category: "Video/Photo",
    price: 299000,
    duration: "12 tháng",
    description: "Thiết kế poster, banner, CV, thumbnail, bài đăng mạng xã hội nhanh chóng.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "youtube-premium-12m",
    name: "YouTube Premium 12 tháng",
    category: "Giải trí",
    price: 419000,
    duration: "12 tháng",
    description: "Xem YouTube không quảng cáo, nghe nhạc nền và trải nghiệm mượt hơn.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "spotify-premium-12m",
    name: "Spotify Premium 12 tháng",
    category: "Giải trí",
    price: 299000,
    duration: "12 tháng",
    description: "Nghe nhạc chất lượng cao, bỏ qua bài hát và tải playlist nghe offline.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "netflix-1m",
    name: "Netflix Premium 1 tháng",
    category: "Giải trí",
    price: 89000,
    duration: "1 tháng",
    description: "Gói giải trí xem phim, series, anime và nội dung hot theo nhu cầu.",
    deliveryType: "manual",
    active: true
  },
  {
    id: "combo-ai-content",
    name: "Combo AI Content",
    category: "ComboApp",
    price: 149000,
    duration: "1 tháng",
    description: "Combo app AI phục vụ học tập, sáng tạo nội dung, hình ảnh và video.",
    deliveryType: "manual",
    active: true
  }
];

export const defaultSettings: SiteSettings = {
  siteTitle: "Minh Wuan Store",
  siteSubtitle: "Cửa hàng tài nguyên số & App Premium",
  brandDomain: "minhwuan.com",
  heroTitle: "Mua tài nguyên số và App Premium trực tiếp tại Minh Wuan Store.",
  heroDescription: "Chọn sản phẩm, thêm vào giỏ hàng và thanh toán bằng VietQR. Sau khi hệ thống xác nhận giao dịch, shop sẽ liên hệ và bàn giao sản phẩm theo thông tin khách hàng cung cấp.",
  warningText: "Minh Wuan Store chỉ cung cấp tài nguyên số phục vụ học tập, làm việc và giải trí hợp lệ. Không hỗ trợ các mục đích vi phạm pháp luật hoặc điều khoản dịch vụ.",
  eventText: "Thanh toán tự động qua VietQR · Xác nhận đơn qua hệ thống · Hỗ trợ và bảo hành rõ ràng",
  zaloLink: "https://zalo.me/0359868717",
  communityLink: "https://zalo.me/0359868717",
  themeMode: "light",
  accentColor: "#2563eb"
};

export function normalizeProduct(input: Partial<Product>): Product {
  const id = String(input.id || input.name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `product-${Date.now()}`;

  return {
    id,
    name: String(input.name || "Sản phẩm mới").trim(),
    category: String(input.category || "Khác").trim(),
    price: Math.max(0, Number(input.price || 0)),
    duration: String(input.duration || "1 tháng").trim(),
    description: String(input.description || "Thông tin sản phẩm sẽ được cập nhật trong thời gian sớm nhất.").trim(),
    deliveryType: "manual",
    active: input.active !== false
  };
}
