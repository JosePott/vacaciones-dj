"use client";

import React from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Dialog({ open, onOpenChange, title, children, footer }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#273440] bg-[#0C1726] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#273440] px-5 py-4">
          <p className="text-sm font-semibold text-white">{title ?? "Detalle"}</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-2 py-1 text-lg font-semibold text-[#5A6473] transition hover:bg-[#273440] hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer ? <div className="border-t border-[#273440] px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
