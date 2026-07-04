"use client";

import React from "react";
import { toast } from "sonner";

import { deleteEmployee } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";

export default function DeleteEmployeeButton({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deletingRef = React.useRef(false);

  const handleDelete = async () => {
    if (deletingRef.current) return;

    deletingRef.current = true;
    setLoading(true);
    setError(null);

    const res = await deleteEmployee(employeeId);

    if (!res.ok) {
      deletingRef.current = false;
      setLoading(false);
      setError(res.error ?? "No se pudo eliminar.");
      toast.error(res.error ?? "No se pudo eliminar.");
      return;
    }

    window.location.assign(`/employees?deleted=${Date.now()}`);
  };

  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={handleDelete} disabled={loading}>
        {loading ? "Eliminando..." : "Eliminar empleado"}
      </Button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
