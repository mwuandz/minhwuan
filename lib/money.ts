export function formatMoney(n: number) {
  return Number(n || 0).toLocaleString("vi-VN") + "đ";
}
