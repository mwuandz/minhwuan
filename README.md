# MinhWuan Store - Giỏ hàng + SePay + Telegram

Website Next.js dùng để bán tài nguyên/app Pro Premium. Khách có thể thêm nhiều sản phẩm vào giỏ hàng, thanh toán bằng VietQR. Sau khi SePay xác nhận tiền vào, hệ thống gửi thông tin đơn hàng về Telegram để admin gửi sản phẩm thủ công cho khách.

## Tính năng

- Giao diện shop app premium hiện đại
- Tìm kiếm/lọc sản phẩm
- Giỏ hàng localStorage
- Checkout nhiều sản phẩm trong một đơn
- Tạo VietQR theo đúng số tiền và mã đơn
- API backend trong Next.js Route Handlers
- Lưu đơn bằng Upstash Redis
- Webhook SePay cập nhật đơn sang `paid`
- Telegram báo đơn mới và đơn đã thanh toán
- Trang admin xem đơn `/admin`

## Cấu hình Vercel

Framework Preset: `Next.js`

Build Command: `npm run build`

Output Directory: để trống / Next.js default

Install Command: `npm install`

Root Directory: `./`

## Environment Variables

```env
NEXT_PUBLIC_BASE_URL=https://www.minhwuan.com
ADMIN_PASSWORD=mat-khau-admin

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

VIETQR_BANK_BIN=970436
VIETQR_ACCOUNT_NO=so-tai-khoan
VIETQR_ACCOUNT_NAME=TEN CHU TAI KHOAN
VIETQR_TEMPLATE=compact2

SEPAY_WEBHOOK_TOKEN=
```

## SePay Webhook

URL webhook:

```txt
https://www.minhwuan.com/api/sepay/webhook
```

Nên chọn:

- Loại giao dịch: Tiền vào
- Định dạng dữ liệu: JSON
- Dùng để xác thực thanh toán: Bật
- Chỉ gửi khi có mã thanh toán: Bật
- Lọc theo mã thanh toán: MW
- Bảo mật lúc test: Không xác thực

## Telegram

Khi khách tạo đơn, bot báo: đơn mới chờ thanh toán.

Khi khách thanh toán xong, bot báo: đơn đã thanh toán, danh sách sản phẩm, thông tin liên hệ để admin gửi sản phẩm thủ công.
