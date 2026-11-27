"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";

type Prize = {
  id: string;
  label: string;
  type: string;
  color?: string;
  weight?: number;
  voucherCode?: string;
  note?: string;
};

type Props = {
  orderId: string;
  open: boolean;
  onClose: () => void;
};

const FALLBACK_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#c41e3a", "#64748b"];

export function SpinWheel({ orderId, open, onClose }: Props) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [title, setTitle] = useState("Vòng quay Noel 🎄");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ label: string; type: string; voucherCode?: string; note?: string } | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !orderId) return;
    setLoaded(false);
    setResult(null);
    setError("");
    fetch(`/api/spin?orderId=${encodeURIComponent(orderId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.config?.prizes) setPrizes(data.config.prizes);
        if (data.config?.title) setTitle(data.config.title);
        if (data.alreadySpun && data.result) {
          setResult({
            label: data.result.prizeLabel,
            type: data.result.prizeType,
          });
        }
      })
      .catch(() => setError("Không tải được vòng quay"))
      .finally(() => setLoaded(true));
  }, [open, orderId]);

  const segment = prizes.length ? 360 / prizes.length : 60;

  const gradient = useMemo(() => {
    if (!prizes.length) return "#334155";
    const parts = prizes.map((p, i) => {
      const color = p.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      const start = (i / prizes.length) * 100;
      const end = ((i + 1) / prizes.length) * 100;
      return `${color} ${start}% ${end}%`;
    });
    return `conic-gradient(from -90deg, ${parts.join(", ")})`;
  }, [prizes]);

  async function handleSpin() {
    if (spinning || result) return;
    setSpinning(true);
    setError("");
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không quay được");
        if (data.result) setResult({ label: data.result.prizeLabel, type: data.result.prizeType });
        setSpinning(false);
        return;
      }
      const prize = data.prize as Prize;
      const idx = Math.max(0, prizes.findIndex((p) => p.id === prize.id));
      const target = 360 * 5 + (360 - idx * segment - segment / 2);
      setRotation((r) => r + target);
      setTimeout(() => {
        setResult({
          label: prize.label,
          type: prize.type,
          voucherCode: prize.voucherCode,
          note: prize.note,
        });
        setSpinning(false);
      }, 4200);
    } catch {
      setError("Lỗi kết nối");
      setSpinning(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel">
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border border-red-200/50 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-600" />
        <button type="button" onClick={onClose} className="absolute right-3 top-4 z-10 rounded-full bg-slate-100 dark:bg-slate-800 p-2.5" aria-label="Đóng">
          <X className="h-5 w-5" />
        </button>
        <div className="p-5 sm:p-6 text-center">
          <h3 className="text-xl font-black pr-8">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">Quay may mắn sau thanh toán · 1 lần / đơn</p>

          <div className="relative mx-auto mt-5 h-64 w-64">
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 text-2xl">▼</div>
            <div
              className="h-full w-full rounded-full border-4 border-amber-400 shadow-inner transition-transform duration-[4s] ease-out"
              style={{
                background: gradient,
                transform: `rotate(${rotation}deg)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-lg font-black shadow">🎄</div>
            </div>
          </div>

          {!loaded ? (
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            </div>
          ) : result ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <div className="text-xs font-bold uppercase text-emerald-700">Bạn nhận được</div>
              <div className="mt-1 text-lg font-black text-slate-900 dark:text-slate-50">{result.label}</div>
              {result.voucherCode && <div className="mt-2 font-mono text-sm font-bold text-red-600">Mã: {result.voucherCode}</div>}
              {result.note && <p className="mt-1 text-xs text-slate-500">{result.note}</p>}
            </div>
          ) : (
            <button type="button" disabled={spinning || !prizes.length} onClick={handleSpin} className="btn-primary mt-5 w-full disabled:opacity-60">
              {spinning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang quay...
                </>
              ) : (
                "Quay ngay 🎡"
              )}
            </button>
          )}

          {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

          <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm font-semibold text-slate-400">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
