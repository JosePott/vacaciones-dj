"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { deleteEmployee } from "@/app/actions/employees";
import { darkLinkClass } from "@/components/ui/dark-table";

export function EmployeeRowActions({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const deletingRef = React.useRef(false);

  async function handleDelete() {
    if (deletingRef.current) return;

    deletingRef.current = true;
    setLoading(true);

    const result = await deleteEmployee(employeeId);

    if (!result.ok) {
      deletingRef.current = false;
      setLoading(false);
      toast.error(result.error ?? "No se pudo eliminar el empleado.");
      return;
    }

    toast.success("Empleado eliminado correctamente.");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/employees/${employeeId}/edit`} className={`${darkLinkClass} text-xs`}>
        Editar
      </Link>
      <span className="text-[#5A6473]">·</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-xs font-semibold text-rose-300 underline decoration-rose-500/40 underline-offset-4 transition hover:text-rose-100 hover:decoration-rose-200 disabled:pointer-events-none disabled:opacity-60"
        aria-label={`Eliminar a ${employeeName}`}
      >
        {loading ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  );
}
