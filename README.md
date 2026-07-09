# MinhWuan Store

Website mẫu bán tài nguyên số/app premium có frontend, backend API routes, VietQR, SePay webhook và thông báo Telegram.

## Công nghệ

- Next.js App Router
- API Route Handlers dùng làm backend
- Upstash Redis để lưu đơn hàng trên Vercel
- VietQR để tạo mã QR chuyển khoản
- SePay webhook để tự xác nhận thanh toán
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

VIETQR_BANK_BIN=970436
VIETQR_ACCOUNT_NO=0123456789
VIETQR_ACCOUNT_NAME=MINHWUAN STORE
VIETQR_TEMPLATE=compact2

SEPAY_WEBHOOK_TOKEN=
```

Không cấu hình SePay thì web vẫn chạy demo VietQR + nút “Demo: đánh dấu đã thanh toán”.
Không cấu hình Upstash Redis thì local chạy bằng bộ nhớ tạm, nhưng deploy Vercel nên dùng Redis để đơn hàng không bị mất.

## Cấu hình Telegram

1. Vào Telegram tìm `@BotFather`
2. Gõ `/newbot`
3. Tạo bot và lấy token
4. Nhắn tin cho bot một câu bất kỳ
5. Lấy `chat_id` bằng cách mở:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
6. Điền `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` vào Vercel Environment Variables

## Cấu hình VietQR

Điền thông tin tài khoản nhận tiền:

```env
VIETQR_BANK_BIN=970436
VIETQR_ACCOUNT_NO=0123456789
VIETQR_ACCOUNT_NAME=MINHWUAN STORE
VIETQR_TEMPLATE=compact2
```

Lưu ý `VIETQR_BANK_BIN` là mã BIN ngân hàng, không phải số tài khoản.

## Cấu hình SePay

Webhook URL:

```text
https://ten-domain-cua-ban.vercel.app/api/sepay/webhook
```

Khi khách chuyển khoản có nội dung chứa mã đơn, ví dụ `MW-1780000000`, SePay bắn webhook về web. Web sẽ tìm mã đơn trong nội dung chuyển khoản, kiểm tra số tiền rồi đổi trạng thái đơn sang `paid` hoặc `delivered`.

Nếu bạn đặt `SEPAY_WEBHOOK_TOKEN`, hãy cấu hình SePay gửi header:

```text
Authorization: Bearer <SEPAY_WEBHOOK_TOKEN>
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
