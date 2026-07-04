"use server";

import { revalidatePath } from "next/cache";

import { ISO_DATE_REGEX } from "@/lib/dates";
import { requestTypeBlocksScheduleMessage } from "@/lib/leave-requests";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type ScheduleActionResult = {
  ok: boolean;
  error?: string;
};

function isValidId(value: string) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function assignWorkShift(input: {
  employeeId: string;
  date: string;
  shiftTemplateId: string;
}): Promise<ScheduleActionResult> {
  const session = await requireRole("HR");

  const employeeId = input.employeeId.trim();
  const date = input.date.trim();
  const shiftTemplateId = input.shiftTemplateId.trim();

  if (!isValidId(employeeId) || !isValidId(shiftTemplateId) || !ISO_DATE_REGEX.test(date)) {
    return { ok: false, error: "Datos invalidos para asignar el turno." };
  }

  const [employee, shiftTemplate] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, isActive: true } }),
    prisma.shiftTemplate.findUnique({
      where: { id: shiftTemplateId },
      select: { id: true, isActive: true },
    }),
  ]);

  if (!employee?.isActive) return { ok: false, error: "Empleado no encontrado o inactivo." };
  if (!shiftTemplate?.isActive) return { ok: false, error: "Turno no encontrado o inactivo." };

  const approvedTimeOff = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: "APPROVED",
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (approvedTimeOff) {
    return {
      ok: false,
      error: requestTypeBlocksScheduleMessage(approvedTimeOff.type),
    };
  }

  await prisma.workShiftAssignment.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: {
      shiftTemplateId,
      updatedBy: session.userId,
    },
    create: {
      employeeId,
      shiftTemplateId,
      date,
      createdBy: session.userId,
      updatedBy: session.userId,
    },
  });

  revalidatePath("/schedules");
  revalidatePath("/my-schedule");

  return { ok: true };
}

export async function clearWorkShift(input: {
  employeeId: string;
  date: string;
}): Promise<ScheduleActionResult> {
  await requireRole("HR");

  const employeeId = input.employeeId.trim();
  const date = input.date.trim();

  if (!isValidId(employeeId) || !ISO_DATE_REGEX.test(date)) {
    return { ok: false, error: "Datos invalidos para borrar el turno." };
  }

  await prisma.workShiftAssignment.deleteMany({
    where: { employeeId, date },
  });

  revalidatePath("/schedules");
  revalidatePath("/my-schedule");

  return { ok: true };
}
