"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { employeeCreateSchema, employeeUpdateSchema } from "@/schemas/employee";

type ActionState = {
  error: string | null;
};

function generateTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export async function createEmployee(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("HR"); // Solo HR puede crear cuentas.

  const parsed = employeeCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    personalEmail: formData.get("personalEmail"),
    area: formData.get("area"),
    position: formData.get("position"),
    vacationSaldo: formData.get("vacationSaldo") ?? 15,
    isActive: formData.has("isActive"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Revisa los datos del formulario." };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return { error: "Ya existe un usuario con ese correo." };
  }

  // Usamos clave temporal si no viene desde el formulario.
  const passwordToUse = data.password ?? generateTempPassword(10);
  const passwordHash = await bcrypt.hash(passwordToUse, 10);

  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "EMPLOYEE",
      employee: {
        create: {
          fullName: data.fullName,
          area: data.area,
          position: data.position,
          personalEmail: data.personalEmail,
          vacationSaldo: data.vacationSaldo ?? 15,
          isActive: data.isActive,
        },
      },
    },
  });

  redirect("/employees?created=1");
}

export async function updateEmployee(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("HR"); // Edicion exclusiva para HR.

  const parsed = employeeUpdateSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    personalEmail: formData.get("personalEmail"),
    area: formData.get("area"),
    position: formData.get("position"),
    vacationSaldo: formData.get("vacationSaldo") ?? 15,
    isActive: formData.has("isActive"),
    password: undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los datos del formulario." };
  }

  const data = parsed.data;

  const employee = await prisma.employee.findUnique({
    where: { id: data.id },
    include: { user: true },
  });

  if (!employee) {
    return { error: "Empleado no encontrado." };
  }

  const emailInUse = await prisma.user.findFirst({
    where: { email: data.email, NOT: { id: employee.userId } },
    select: { id: true },
  });
  if (emailInUse) {
    return { error: "Ya existe un usuario con ese correo." };
  }

  await prisma.user.update({
    where: { id: employee.userId },
    data: {
      email: data.email,
      employee: {
        update: {
          fullName: data.fullName,
          area: data.area,
          position: data.position,
          personalEmail: data.personalEmail ?? null,
          vacationSaldo: data.vacationSaldo ?? 15,
          isActive: data.isActive,
        },
      },
    },
  });

  redirect("/employees?updated=1");
}

export async function deleteEmployee(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("HR"); // Controla que un HR no se borre el piso bajo.

  if (!id) return { ok: false, error: "ID invalido" };

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!employee) return { ok: false, error: "Empleado no encontrado" };

  // Evita que un HR elimine su propia cuenta y quede bloqueado.
  if (employee.userId === session.userId) {
    return { ok: false, error: "No puedes eliminar tu propio usuario." };
  }

  await prisma.workShiftAssignment.deleteMany({ where: { employeeId: employee.id } });
  await prisma.leaveRequest.deleteMany({ where: { employeeId: employee.id } });

  await prisma.user.delete({
    where: { id: employee.userId },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);

  return { ok: true };
}
