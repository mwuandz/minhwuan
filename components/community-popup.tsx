"use client";

import { X } from "lucide-react";
import { SiteSettings } from "@/lib/types";

type Props = {
  open: boolean;
  settings: SiteSettings;
  fallbackLink: string;
  onClose: () => void;
};

export function CommunityPopup({ open, settings, fallbackLink, onClose }: Props) {
  if (!open) return null;
  const link = settings.communityLink || settings.zaloLink || fallbackLink;
  return (
    <div
      className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop-noel"
      onClick={onClose}
    >
      <div
        className="card-surface relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-slate-100 p-2.5 dark:bg-slate-800"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0068FF]/20 text-2xl">
          💬
        </div>
        <h3 className="pr-10 text-xl font-black text-slate-900 dark:text-white">
          {settings.communityPopupTitle || "Tham gia nhóm cộng đồng Zalo"}
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {settings.communityPopupDescription ||
            "Vào nhóm để nhận bảng giá mới, event Free và ưu đãi dành riêng cho khách Minh Wuan Store."}
        </p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#0054d1]"
        >
          Vào nhóm Zalo
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Để sau
        </button>
      </div>
    </div>
  );
}
