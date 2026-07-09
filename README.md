# MinhWuan Store

Website mẫu bán tài nguyên số/app premium có frontend, backend API routes, thanh toán payOS/VietQR, webhook và thông báo Telegram.

## Công nghệ

- Next.js App Router
- API Route Handlers dùng làm backend
- Upstash Redis để lưu đơn hàng trên Vercel
- payOS để tạo link thanh toán và nhận webhook
- Telegram Bot API để gửi thông báo đơn hàng

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở: `http://localhost:3000`

## Biến môi trường

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_PASSWORD=change-this-admin-password

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
```

Không cấu hình payOS thì web vẫn chạy demo VietQR + nút “Demo: đánh dấu đã thanh toán”.
Không cấu hình Upstash Redis thì local chạy bằng bộ nhớ tạm, nhưng deploy Vercel nên dùng Redis để đơn hàng không bị mất.

## Cấu hình Telegram

1. Vào Telegram tìm `@BotFather`
2. Gõ `/newbot`
3. Tạo bot và lấy token
4. Nhắn tin cho bot một câu bất kỳ
5. Lấy `chat_id` bằng cách mở:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
6. Điền `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` vào Vercel Environment Variables

## Cấu hình payOS

1. Tạo tài khoản payOS
2. Lấy `CLIENT_ID`, `API_KEY`, `CHECKSUM_KEY`
3. Điền vào Environment Variables
4. Set webhook URL:

```text
https://ten-domain-cua-ban.vercel.app/api/payos/webhook
```

## Deploy Vercel

1. Đẩy thư mục này lên GitHub
2. Vào Vercel → New Project → Import repo
3. Thêm Environment Variables
4. Deploy
5. Sau deploy, cập nhật:

```env
NEXT_PUBLIC_BASE_URL=https://ten-domain-cua-ban.vercel.app
```

## Lưu ý kinh doanh

Chỉ nên bán sản phẩm/tài nguyên hợp lệ, minh bạch chính sách bảo hành, thời hạn sử dụng và điều kiện kích hoạt. Không nên kinh doanh tài khoản crack, bypass hoặc nội dung vi phạm điều khoản dịch vụ.
