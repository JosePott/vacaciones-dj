"use server";

import { redirect } from "next/navigation";

import { inclusiveDaysBetween, isoToEpochDay } from "@/lib/dates";
import { businessDaysBetweenWithChileHolidays } from "@/lib/holidays";
import { notifyHrNewLeaveRequest } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { leaveRequestCreateSchema } from "@/schemas/leaveRequest";

type ActionState = { error: string | null };

export async function submitLeaveRequest(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole("EMPLOYEE"); // Solo empleados envian sus propias solicitudes.

  const parsed = leaveRequestCreateSchema.safeParse({
    type: formData.get("type"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const start = parsed.data.startDate;
  const end = parsed.data.endDate;
  const type = parsed.data.type;

  if (isoToEpochDay(end) < isoToEpochDay(start)) {
    return { error: "La fecha de fin debe ser mayor o igual a la de inicio." };
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      fullName: true,
      area: true,
      position: true,
      personalEmail: true,
      vacationSaldo: true,
      user: { select: { email: true } },
    },
  });

  if (!employee) {
    return { error: "No se encontro tu perfil de empleado." };
  }

  const requestedDays =
    type === "VACATION"
      ? await businessDaysBetweenWithChileHolidays(start, end)
      : inclusiveDaysBetween(start, end);

  if (type === "VACATION" && requestedDays > employee.vacationSaldo) {
    // No dejamos avanzar si el rango excede el saldo disponible.
    return {
      error: `El periodo solicitado (${requestedDays} días hábiles) supera tu saldo (${employee.vacationSaldo}).`,
    };
  }

  const duplicate = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: employee.id,
      status: "PENDING",
      startDate: start,
      endDate: end,
    },
    select: { id: true },
  });

  if (duplicate) {
    return { error: "Ya tienes una solicitud pendiente con el mismo rango de fechas." };
  }

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      type,
      startDate: start,
      endDate: end,
      comment: parsed.data.comment,
      status: "PENDING",
    },
  });

  await notifyHrNewLeaveRequest({
    id: request.id,
    startDate: request.startDate,
    endDate: request.endDate,
    type: request.type,
    comment: request.comment,
    businessDays: requestedDays,
    employee: {
      fullName: employee.fullName,
      area: employee.area,
      position: employee.position,
      email: employee.personalEmail ?? employee.user.email,
    },
  });

  redirect("/my-requests?created=1");
}
