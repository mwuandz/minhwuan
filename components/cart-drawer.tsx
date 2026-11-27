"use client";

import { X, Minus, Plus, Trash2, Tag, Loader2, Gift } from "lucide-react";
import { CartItem } from "@/lib/types";
import { formatMoney } from "@/lib/money";

type VoucherState = {
  code: string;
  valid: boolean;
  discountAmount: number;
  message: string;
};

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  voucherInput: string;
  onVoucherInput: (v: string) => void;
  voucher: VoucherState | null;
  voucherLoading: boolean;
  onApplyVoucher: () => void;
  onChangeQuantity: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  cartTotal: number;
  discountAmount: number;
  payableTotal: number;
  onCheckout: (formData: FormData) => void;
  loading: boolean;
  zaloLink?: string;
};

export function CartDrawer({
  open,
  onClose,
  items,
  voucherInput,
  onVoucherInput,
  voucher,
  voucherLoading,
  onApplyVoucher,
  onChangeQuantity,
  onRemove,
  cartTotal,
  discountAmount,
  payableTotal,
  onCheckout,
  loading,
  zaloLink = "https://zalo.me/0359868717",
}: CartDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900/40 px-5 py-4 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/20">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Gift className="h-5 w-5 text-red-600" />
            Giỏ hàng ({items.length})
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <div className="mb-3 text-5xl">🎄</div>
              <p className="font-semibold">Giỏ hàng trống</p>
              <p className="mt-1 text-sm">Thêm sản phẩm để nhận ưu đãi Noel</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-snug truncate">{item.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.duration}</div>
                    <div className="mt-2 font-black text-sm text-red-700 dark:text-red-400">
                      {formatMoney(item.price)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemove(item.productId)}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => onChangeQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-xl"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => onChangeQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-xl"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-red-100 dark:border-red-900/40 px-5 py-4 space-y-4 bg-gradient-to-t from-red-50/50 to-transparent dark:from-red-950/20">
            {/* Voucher */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={voucherInput}
                  onChange={(e) => onVoucherInput(e.target.value)}
                  placeholder="Mã voucher Noel"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                />
              </div>
              <button
                onClick={onApplyVoucher}
                disabled={voucherLoading}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #c41e3a, #9b1b2e)" }}
              >
                {voucherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
              </button>
            </div>
            {voucher && (
              <p className={`text-xs font-medium ${voucher.valid ? "text-emerald-600" : "text-red-500"}`}>
                {voucher.message}
              </p>
            )}

            {/* Summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-semibold">{formatMoney(cartTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Giảm giá</span>
                  <span className="font-semibold">-{formatMoney(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Thanh toán</span>
                <span className="text-red-700 dark:text-red-400">{formatMoney(payableTotal)}</span>
              </div>
            </div>

            {/* Checkout form */}
            <form
              action={(formData) => onCheckout(formData)}
              className="space-y-3"
            >
              <input
                name="customerName"
                required
                placeholder="Họ tên *"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-red-400"
              />
              <input
                name="customerContact"
                required
                placeholder="Zalo / SĐT *"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-red-400"
              />
              <input
                name="customerEmail"
                type="email"
                placeholder="Email (tuỳ chọn)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-red-400"
              />
              <textarea
                name="customerNote"
                rows={2}
                placeholder="Ghi chú đơn hàng"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-lg disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #c41e3a 0%, #9b1b2e 50%, #d4a017 100%)",
                  boxShadow: "0 10px 28px -6px rgba(196, 30, 58, 0.45)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo đơn...
                  </span>
                ) : (
                  "🎄 Thanh toán VietQR"
                )}
              </button>
            </form>

            <a
              href={zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-semibold text-slate-500 hover:text-red-600 transition"
            >
              Cần hỗ trợ? Chat Zalo ngay
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
