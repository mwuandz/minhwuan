# MinhWuan Store - Cart + Admin Products + SePay

Website Next.js deploy Vercel cho shop app Pro/Premium.

## Tính năng

- Giao diện sáng mặc định, có thể đổi theme sáng/tối trong admin.
- Khách thêm nhiều sản phẩm vào giỏ hàng và thanh toán 1 lần bằng VietQR.
- SePay webhook tự xác nhận thanh toán.
- Telegram báo đơn mới và đơn đã thanh toán để admin gửi sản phẩm thủ công.
- Admin quản lý đơn hàng.
- Admin thêm/sửa/xóa sản phẩm, chỉnh giá, danh mục, thời hạn, mô tả.
- Admin sửa tiêu đề web, hero text, cảnh báo, event, link Zalo, màu chủ đạo.

## Biến môi trường trên Vercel

```env
NEXT_PUBLIC_BASE_URL=https://www.minhwuan.com
ADMIN_PASSWORD=matkhauadmin

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

VIETQR_BANK_BIN=970436
VIETQR_ACCOUNT_NO=so_tai_khoan_cua_ban
VIETQR_ACCOUNT_NAME=TEN CHU TAI KHOAN
VIETQR_TEMPLATE=compact2

SEPAY_WEBHOOK_TOKEN=
```

## Deploy

1. Upload toàn bộ file trong thư mục này lên GitHub.
2. Vercel Framework Preset: `Next.js`.
3. Build Command: `npm run build`.
4. Output Directory: để trống / Next.js default.
5. Redeploy without cache.

## Link quan trọng

- Trang chủ: `/`
- Admin: `/admin`
- Webhook SePay: `/api/sepay/webhook`

## Dùng admin

Vào `/admin`, nhập `ADMIN_PASSWORD`, bấm **Tải dữ liệu**.

- Tab **Sản phẩm & giá**: thêm sản phẩm, sửa giá, xóa sản phẩm, bật/tắt hiển thị.
- Tab **Tiêu đề & theme**: sửa tiêu đề web, dòng phụ, hero, link Zalo, màu chủ đạo, theme sáng/tối.
- Tab **Đơn hàng**: xem đơn đã tạo/thanh toán.

## SePay

Webhook URL:

```txt
https://www.minhwuan.com/api/sepay/webhook
```

Nên chọn:

- Loại giao dịch: Tiền vào
- Định dạng: JSON
- Chỉ gửi khi có mã thanh toán: bật
- Lọc mã thanh toán: `MW`
