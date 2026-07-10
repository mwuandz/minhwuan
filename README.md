# Minh Wuan Store - App Pro/Premium

Website bán App Pro/Premium chính thức cho `minhwuan.com`.

## Tính năng

- Bảng giá mới cập nhật 8/7 theo danh sách Combo AI, App AI, Video/Photo, Giải trí.
- Giao diện sáng, hiệu ứng card sản phẩm, icon/ảnh sản phẩm dạng emoji dễ chỉnh trong admin.
- Giỏ hàng mua nhiều sản phẩm cùng lúc.
- Voucher tại checkout: khách nhập mã, hệ thống tự trừ tiền trước khi tạo QR.
- Admin tạo/sửa/xóa voucher, chỉnh sản phẩm, giá, icon, badge, tiêu đề web và theme.
- Tạo VietQR theo đơn hàng, mặc định MBBank `970422`.
- SePay webhook xác nhận thanh toán tự động.
- Telegram báo đơn mới và đơn đã thanh toán để admin gửi sản phẩm thủ công.
- Đơn pending tự hết hạn/xóa sau 15 phút nếu chưa thanh toán.
- Admin phải nhập đúng `ADMIN_PASSWORD` mới thấy phần quản lý.

## Deploy Vercel

Build settings khuyên dùng:

```txt
Framework Preset: Next.js
Install Command: bun install
Build Command: bun run build
Output Directory: Next.js default
Root Directory: ./
```

## Environment Variables

```env
NEXT_PUBLIC_BASE_URL=https://www.minhwuan.com
ADMIN_PASSWORD=mat-khau-admin

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

VIETQR_BANK_BIN=970422
VIETQR_ACCOUNT_NO=so-tai-khoan-mb
VIETQR_ACCOUNT_NAME=DOAN MINH QUAN
VIETQR_TEMPLATE=compact2

SEPAY_WEBHOOK_TOKEN=
```

Khi test SePay, có thể để trống `SEPAY_WEBHOOK_TOKEN` và chọn **Không xác thực** trong SePay.

Webhook SePay:

```txt
https://www.minhwuan.com/api/sepay/webhook
```

Nên bật:

- Loại giao dịch: Tiền vào
- Định dạng: JSON
- Chỉ gửi khi có mã thanh toán: bật
- Lọc mã thanh toán: MW

## Admin

Vào:

```txt
https://www.minhwuan.com/admin
```

Nhập `ADMIN_PASSWORD` rồi quản lý:

- Đơn hàng
- Sản phẩm & giá
- Voucher
- Tiêu đề & theme

Voucher mẫu có sẵn: `WELCOME10` giảm 10%, tối đa 50k, đơn từ 100k.
