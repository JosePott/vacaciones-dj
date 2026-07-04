"use client";

import React from "react";
import { createPortal } from "react-dom";

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
};

export function AlertDialog({
  open,
  onOpenChange,
  title = "Confirmar acción",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  loading = false,
}: AlertDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!open) return null;
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#273440] bg-[#0C1726] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#273440] px-5 py-4">
          <p className="text-sm font-semibold text-white">{title}</p>
          {description ? <p className="mt-1 text-xs text-[#5A6473]">{description}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-[#273440] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#273440]"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-emerald-500/60 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Guardando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
