import { Product, SiteSettings, Voucher } from "./types";

export const defaultProducts: Product[] = [
  { id: "combo-ai-pro", name: "Combo AI PRO", category: "Combo tiết kiệm", price: 371000, duration: "ChatGPT Pro 1 tháng + Gemini Pro 1 năm", description: "Combo tiết kiệm gồm ChatGPT Pro 1 tháng và Gemini Pro 1 năm kèm 5TB Drive.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com", badge: "Combo hot" },
  { id: "combo-ai-edit-video", name: "Combo AI + EDIT VIDEO", category: "Combo tiết kiệm", price: 575000, duration: "ChatGPT Pro 1 tháng + CapCut Pro 1 năm", description: "Combo dành cho sáng tạo nội dung: AI hỗ trợ ý tưởng và CapCut Pro dựng video.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com", badge: "Tiết kiệm" },
  { id: "combo-edit-video-hot", name: "Combo EDIT VIDEO HOT", category: "Combo tiết kiệm", price: 500000, duration: "CapCut Pro 1 năm + Locket Gold", description: "Combo chỉnh video hot gồm CapCut Pro 1 năm và Locket Gold bản quay video 15s.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com", badge: "Hot" },

  { id: "chatgpt-plus-1m", name: "ChatGPT Plus", category: "App AI", price: 179000, duration: "1 tháng", description: "Acc cấp hoặc nâng chính chủ. Phù hợp học tập, code, viết nội dung và làm việc.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com", badge: "Plus" },
  { id: "chatgpt-plus-1m-kbh", name: "ChatGPT Plus KBH", category: "App AI", price: 99000, duration: "1 tháng", description: "Gói ChatGPT Plus 1 tháng giá tốt, không bảo hành. Vui lòng đọc kỹ trước khi mua.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com", badge: "Giá tốt" },
  { id: "chatgpt-pro-1m", name: "ChatGPT Pro", category: "App AI", price: 219000, duration: "1 tháng", description: "Gói ChatGPT Pro 1 tháng, hỗ trợ nhu cầu AI nâng cao.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com", badge: "Pro" },
  { id: "gemini-pro-5tb-1y", name: "Gemini Pro + 5TB Drive", category: "App AI", price: 222000, duration: "1 năm", description: "Nâng chính chủ Gemini Pro kèm 5TB Drive, phù hợp lưu trữ và làm việc dài hạn.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=gemini.google.com", badge: "5TB" },
  { id: "supergrok-ai-7d", name: "SuperGrok AI", category: "App AI", price: 29000, duration: "7 ngày", description: "Acc cấp hoặc nâng chính chủ SuperGrok AI dùng ngắn hạn.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=grok.com", badge: "7 ngày" },
  { id: "supergrok-ai-30d", name: "SuperGrok AI", category: "App AI", price: 150000, duration: "30 ngày", description: "Gói SuperGrok AI 30 ngày cho nhu cầu AI thường xuyên.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=grok.com", badge: "30 ngày" },
  { id: "supergrok-ai-1y", name: "SuperGrok AI", category: "App AI", price: 499000, duration: "1 năm", description: "Gói SuperGrok AI 1 năm, tiết kiệm cho người dùng lâu dài.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=grok.com", badge: "1 năm" },
  { id: "claude-ai-pro-1m", name: "Claude AI Pro", category: "App AI", price: 489000, duration: "1 tháng", description: "Nâng chính chủ Claude AI Pro, sản phẩm mới dành cho nhu cầu AI chuyên sâu.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=claude.ai", badge: "New" },
  { id: "kling-ai-4500-credit", name: "Kling AI", category: "App AI", price: 629000, duration: "4k5 credit", description: "Gói Kling AI 4k5 credit dành cho tạo video AI và nội dung sáng tạo.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=klingai.com", badge: "New" },

  { id: "capcut-pro-7d", name: "CapCut Pro", category: "Video / Photo", price: 19000, duration: "7 ngày", description: "Acc cấp CapCut Pro, mở khóa hiệu ứng và tính năng dựng video.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com", badge: "Rẻ" },
  { id: "capcut-pro-1m", name: "CapCut Pro", category: "Video / Photo", price: 79000, duration: "1 tháng", description: "Acc cấp CapCut Pro 1 tháng cho chỉnh sửa video, template và hiệu ứng Pro.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com", badge: "Hot" },
  { id: "capcut-pro-6m", name: "CapCut Pro", category: "Video / Photo", price: 249000, duration: "6 tháng", description: "Gói CapCut Pro 6 tháng hiện tạm hết, có thể liên hệ shop để cập nhật tình trạng.", deliveryType: "manual", active: false, image: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com", badge: "Tạm hết" },
  { id: "capcut-pro-1y-1device", name: "CapCut Pro", category: "Video / Photo", price: 419000, duration: "1 năm / 1 thiết bị", description: "Acc cấp CapCut Pro 1 năm cho 1 thiết bị, phù hợp editor dùng lâu dài.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=capcut.com", badge: "Best" },
  { id: "canva-pro-1m", name: "Canva Pro", category: "Video / Photo", price: 20000, duration: "1 tháng", description: "Nâng chính chủ Canva Pro, thiết kế poster, banner, CV, thumbnail nhanh chóng.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=canva.com", badge: "Design" },
  { id: "canva-pro-1y", name: "Canva Pro", category: "Video / Photo", price: 49000, duration: "1 năm", description: "Nâng chính chủ Canva Pro 1 năm giá tốt cho học tập và thiết kế.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=canva.com", badge: "1 năm" },
  { id: "meitu-vip-7d", name: "Meitu VIP", category: "Video / Photo", price: 25000, duration: "7 ngày", description: "Acc cấp Meitu VIP, chỉnh ảnh và làm đẹp nhanh chóng.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=meitu.com", badge: "New" },
  { id: "meitu-vip-1m", name: "Meitu VIP", category: "Video / Photo", price: 75000, duration: "1 tháng", description: "Acc cấp Meitu VIP 1 tháng, phù hợp chỉnh ảnh/video ngắn.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=meitu.com", badge: "New" },
  { id: "locket-gold-video", name: "Locket Gold", category: "Video / Photo", price: 39000, duration: "Bản quay video 15s", description: "Locket Gold bản quay video 15s, kích hoạt nhanh.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=locket.camera", badge: "Gold" },
  { id: "adobe-pro-full-app-1m", name: "Adobe Pro Full App", category: "Video / Photo", price: 119000, duration: "1 tháng", description: "Acc cấp Adobe Pro Full App 1 tháng, sản phẩm mới cho thiết kế và chỉnh sửa.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=adobe.com", badge: "New" },

  { id: "youtube-premium-1m", name: "YouTube Premium", category: "Giải trí", price: 39000, duration: "1 tháng", description: "Nâng chính chủ YouTube Premium, xem không quảng cáo và nghe nền.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com", badge: "YT" },
  { id: "youtube-premium-family-1m", name: "YouTube Premium Family", category: "Giải trí", price: 139000, duration: "1 tháng / 5 tài khoản", description: "Gói gia đình 5 tài khoản YouTube Premium, phù hợp mua chung.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com", badge: "Family" },
  { id: "youtube-premium-1y", name: "YouTube Premium", category: "Giải trí", price: 419000, duration: "1 năm", description: "Nâng chính chủ YouTube Premium 1 năm, ổn định và tiết kiệm.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com", badge: "1 năm" },
  { id: "netflix-4k-random", name: "Netflix 4K", category: "Giải trí", price: 29000, duration: "2 tuần – 1 tháng", description: "Acc cấp sẵn gói ngắn hạn random, phù hợp dùng thử hoặc xem ngắn ngày.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=netflix.com", badge: "4K" },
  { id: "netflix-4k-private-1m", name: "Netflix 4K riêng tư", category: "Giải trí", price: 59000, duration: "1 tháng", description: "Gói Netflix 4K 1 tháng ổn định riêng tư.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=netflix.com", badge: "Private" },
  { id: "netflix-family-5-profile", name: "Netflix Family 5 Profile", category: "Giải trí", price: 279000, duration: "1 tháng", description: "Gói gia đình 5 profile Netflix, phù hợp nhóm dùng chung.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=netflix.com", badge: "Family" },
  { id: "spotify-premium-1m", name: "Spotify Premium", category: "Giải trí", price: 39000, duration: "1 tháng", description: "Nâng chính chủ Spotify Premium 1 tháng, nghe nhạc không quảng cáo.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=spotify.com", badge: "Music" },
  { id: "spotify-premium-3m", name: "Spotify Premium", category: "Giải trí", price: 88000, duration: "3 tháng", description: "Nâng chính chủ Spotify Premium 3 tháng, tiết kiệm hơn gói tháng.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=spotify.com", badge: "3 tháng" },
  { id: "ai-credit-veo3", name: "Veo3 / AI nhiều credit", category: "App AI", price: 0, duration: "Liên hệ", description: "Các sản phẩm Veo3 và AI nhiều credit có giá theo thời điểm. Liên hệ shop để được báo giá nhanh.", deliveryType: "manual", active: true, image: "https://www.google.com/s2/favicons?sz=128&domain=deepmind.google", badge: "Liên hệ" }
];

export const defaultVouchers: Voucher[] = [
  {
    id: "WELCOME10",
    code: "WELCOME10",
    description: "Giảm 10% cho đơn đầu tiên, tối đa 50k",
    type: "percent",
    value: 10,
    maxDiscount: 50000,
    minOrderAmount: 100000,
    active: true,
    applicableProductIds: [],
    createdAt: new Date().toISOString()
  }
];

export const defaultSettings: SiteSettings = {
  siteTitle: "Minh Wuan Store",
  siteSubtitle: "Bảng giá App Pro/Premium cập nhật 8/7",
  brandDomain: "minhwuan.com",
  heroTitle: "Mua App Pro/Premium trực tiếp tại Minh Wuan Store.",
  heroDescription: "Chọn sản phẩm, thêm vào giỏ hàng, nhập voucher nếu có và thanh toán bằng VietQR. Sau khi hệ thống xác nhận giao dịch, shop sẽ liên hệ và bàn giao sản phẩm theo thông tin khách hàng cung cấp.",
  warningText: "Bảng giá App Pro/Premium cập nhật 8/7 · Thanh toán tự động · Shop gửi sản phẩm thủ công sau khi nhận đơn.",
  eventText: "Event tặng Free 2 lần/tuần vào tối thứ 4 và tối thứ 7 🔥 · Bảo hành trong thời gian sử dụng · Kích hoạt nhanh 1–5 phút",
  zaloLink: "https://zalo.me/0359868717",
  communityLink: "https://zalo.me/g/vzveml426",
  communityPopupEnabled: true,
  communityPopupTitle: "Tham gia nhóm cộng đồng Zalo",
  communityPopupDescription: "Vào nhóm để nhận bảng giá mới, event Free tối thứ 4/thứ 7 và ưu đãi dành riêng cho khách của Minh Wuan Store.",
  flashSaleEnabled: true,
  flashSaleTitle: "Flash Sale App Premium hôm nay",
  flashSaleDescription: "Săn nhanh các gói hot với giá tốt. Số lượng ưu đãi có hạn, shop xử lý thủ công sau khi thanh toán thành công.",
  flashSaleBadge: "FLASH SALE",
  flashSaleEndsAt: "",
  flashSaleProductIds: ["chatgpt-plus-1m-kbh", "capcut-pro-1m", "youtube-premium-1m", "netflix-4k-private-1m"],
  flashSaleCta: "Mua ngay",
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
    active: input.active !== false,
    image: String(input.image || "💎").trim(),
    badge: String(input.badge || "").trim()
  };
}

export function normalizeVoucher(input: Partial<Voucher>): Voucher {
  const code = String(input.code || input.id || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const id = code || `VOUCHER${Date.now()}`;

  return {
    id,
    code: id,
    description: String(input.description || "").trim(),
    type: input.type === "percent" ? "percent" : "fixed",
    value: Math.max(0, Number(input.value || 0)),
    minOrderAmount: Math.max(0, Number(input.minOrderAmount || 0)),
    maxDiscount: Math.max(0, Number(input.maxDiscount || 0)),
    usageLimit: Math.max(0, Number(input.usageLimit || 0)),
    usedCount: Math.max(0, Number(input.usedCount || 0)),
    expiresAt: input.expiresAt ? String(input.expiresAt) : undefined,
    active: input.active !== false,
    applicableProductIds: Array.isArray(input.applicableProductIds)
      ? input.applicableProductIds.map((id) => String(id)).filter(Boolean)
      : [],
    createdAt: input.createdAt || new Date().toISOString()
  };
}
