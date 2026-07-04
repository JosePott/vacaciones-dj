"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { approveLeaveRequest, rejectLeaveRequest } from "@/app/actions/requests";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DecisionActionsProps = {
  requestId: string;
};

export default function DecisionActions({ requestId }: DecisionActionsProps) {
  const [note, setNote] = React.useState("");
  const [open, setOpen] = React.useState<null | "approve" | "reject">(null);
  const [confirming, setConfirming] = React.useState<null | "approve" | "reject">(null);
  const [error, setError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (action: "approve" | "reject") => {
    startTransition(async () => {
      setError(null);
      const fn = action === "approve" ? approveLeaveRequest : rejectLeaveRequest;
      const result = await fn(requestId, note);

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setOpen(null);
      setNote("");
      setError(null);
      toast.success(action === "approve" ? "Solicitud aprobada" : "Solicitud rechazada");
      if ("notificationWarning" in result && result.notificationWarning) {
        toast.warning(result.notificationWarning);
      }
      router.refresh();
    });
  };

  const confirmAndSubmit = (action: "approve" | "reject") => {
    setConfirming(action);
  };

  const closeDialog = () => {
    setOpen(null);
    setError(null);
    setNote("");
  };

  const dialogTitle = open === "approve" ? "Aprobar solicitud" : "Rechazar solicitud";
  const dialogCta = open === "approve" ? "Confirmar aprobaci\u00f3n" : "Confirmar rechazo";

  const decisionDialog =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={dialogTitle}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDialog();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeDialog();
            }}
          >
            <div className="w-full max-w-md overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0A1024] shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between border-b border-white/8 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{dialogTitle}</p>
                  <p className="text-xs text-slate-400">
                    Agrega una nota opcional que vera el empleado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-lg px-2 py-1 text-lg font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white"
                  aria-label="Cerrar"
                  disabled={isPending}
                >
                  x
                </button>
              </div>

              <div className="space-y-3 px-4 py-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                  Nota (opcional)
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    className="app-field min-h-[120px] w-full rounded-xl px-3 py-2 text-sm"
                    placeholder="Ej: Se aprueba por cobertura del equipo."
                    autoFocus
                    disabled={isPending}
                  />
                </label>

                {error ? (
                  <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/8 px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/12 text-white hover:bg-white/8"
                  onClick={closeDialog}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-400"
                  onClick={() => confirmAndSubmit(open)}
                  disabled={isPending}
                >
                  {isPending ? "Guardando..." : dialogCta}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        <Button
          size="sm"
          className="w-full bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 shadow-sm"
          onClick={() => setOpen("approve")}
          disabled={isPending}
        >
          Aprobar
        </Button>
        <Button
          size="sm"
          className="w-full bg-transparent border border-rose-500 text-rose-100 hover:bg-rose-500/15 hover:text-rose-50"
          onClick={() => setOpen("reject")}
          disabled={isPending}
        >
          Rechazar
        </Button>
      </div>

      {decisionDialog}

      <AlertDialog
        open={!!confirming}
        onOpenChange={(v) => {
          if (!v) setConfirming(null);
        }}
        title={confirming === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}
        description="Esta acción actualizará el estado de la solicitud."
        confirmLabel={confirming === "approve" ? "Aprobar" : "Rechazar"}
        onConfirm={() => {
          if (!confirming) return;
          handleSubmit(confirming);
          setConfirming(null);
        }}
        loading={isPending}
      />
    </>
  );
}
