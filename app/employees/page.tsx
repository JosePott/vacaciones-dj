import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DarkTable,
  DarkTableWrapper,
  darkTdClass,
  darkThClass,
  darkTrClass,
  darkTheadClass,
} from "@/components/ui/dark-table";
import { RouteToaster } from "@/components/ui/route-toaster";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { EmployeeRowActions } from "./employee-row-actions";

type SearchParams = {
  q?: string;
  active?: "true" | "false" | "all";
  created?: string;
  deleted?: string;
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearch = await searchParams;

  await requireRole("HR");

  const q = (resolvedSearch?.q ?? "").toString().trim();
  const activeFilter = (resolvedSearch?.active as SearchParams["active"]) ?? "all";

  const employees = await prisma.employee.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { user: { email: { contains: q } } },
              { personalEmail: { contains: q } },
            ],
          }
        : {}),
      ...(activeFilter === "true"
        ? { isActive: true }
        : activeFilter === "false"
          ? { isActive: false }
          : {}),
    },
    orderBy: { fullName: "asc" },
    include: {
      user: { select: { email: true, id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <RouteToaster
        flags={[
          { param: "created", message: "Empleado creado correctamente" },
          { param: "deleted", message: "Empleado eliminado" },
          { param: "updated", message: "Empleado actualizado correctamente" },
        ]}
      />

      <div className="rounded-[1.5rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.2)_55%,rgba(124,58,237,0.14))] p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Empleados</h1>
          <p className="mt-2 text-sm text-slate-400">Listado de colaboradores y sus datos clave.</p>
        </div>
        <Link href="/employees/new" className="mt-4 inline-flex sm:mt-0">
          <Button>Nuevo empleado</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Busca por nombre o email y filtra por estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchFilters q={q} active={activeFilter} />

          <DarkTableWrapper className="overflow-x-auto">
            <DarkTable>
              <thead className={darkTheadClass}>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Email</Th>
                  <Th>Correo personal</Th>
                  <Th>Área</Th>
                  <Th>Cargo</Th>
                  <Th className="text-right">Saldo días</Th>
                  <Th>Activo</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr className={darkTrClass}>
                    <td colSpan={8} className="px-4 py-6 text-center text-white/70">
                      Sin resultados para estos filtros.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className={darkTrClass}>
                      <Td>{emp.fullName}</Td>
                  <Td className="text-white/80">{emp.user?.email ?? "—"}</Td>
                  <Td className="text-white/80">{emp.personalEmail ?? "—"}</Td>
                  <Td className="text-white/80">{emp.area}</Td>
                  <Td className="text-white/80">{emp.position ?? "—"}</Td>
                  <Td className="text-right font-semibold text-white">{emp.vacationSaldo}</Td>
                  <Td>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            emp.isActive
                              ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-200 border border-rose-500/30"
                          }`}
                        >
                          {emp.isActive ? "Sí" : "No"}
                        </span>
                      </Td>
                      <Td className="text-right">
                    <EmployeeRowActions employeeId={emp.id} employeeName={emp.fullName} />
                  </Td>
                </tr>
              ))
            )}
              </tbody>
            </DarkTable>
          </DarkTableWrapper>
        </CardContent>
      </Card>
    </div>
  );
}

function SearchFilters({ q, active }: { q: string; active: SearchParams["active"] }) {
  return (
    <form className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o email"
          className="app-field h-10 w-full rounded-xl px-3 text-sm"
        />
        <select
          name="active"
          defaultValue={active ?? "all"}
          className="app-field h-10 w-full rounded-xl px-3 text-sm md:w-40"
        >
          <option value="all">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="default" size="md">
          Aplicar
        </Button>
        <Link href="/employees">
          <Button type="button" variant="outline" size="md">
            Limpiar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`${darkThClass} ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`${darkTdClass} ${className}`}>{children}</td>;
}
