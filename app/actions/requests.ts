"use server";

import { revalidatePath } from "next/cache";

import { inclusiveDaysBetween } from "@/lib/dates";
import { businessDaysBetweenWithChileHolidays } from "@/lib/holidays";
import { notifyEmployeeLeaveDecision } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { leaveRequestDecisionSchema } from "@/schemas/leaveRequest";

type RequestActionResult =
  | {
      success: true;
      employeeId?: string;
      notification?: {
        id: string;
        startDate: string;
        endDate: string;
        type: "VACATION" | "DAY_OFF";
        comment: string | null;
        decisionNote: string | null;
        status: ResolveStatus;
        businessDays: number;
        employee: {
          fullName: string;
          area: string;
          position: string | null;
          email: string | null;
        };
      };
      notificationWarning?: string;
    }
  | { success: false; error: string };
type ResolveStatus = "APPROVED" | "REJECTED";

async function resolveLeaveRequest(
  params: { id: string; note?: string; status: ResolveStatus },
): Promise<RequestActionResult> {
  const session = await requireRole("HR"); // Solo HR puede aprobar o rechazar.

  const parsed = leaveRequestDecisionSchema.safeParse({ id: params.id, note: params.note });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos invalidos.";
    return { success: false, error: message };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id: parsed.data.id },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              area: true,
              position: true,
              personalEmail: true,
              vacationSaldo: true,
              user: { select: { email: true } },
            },
          },
        },
      });

      if (!request) {
        return { success: false, error: "Solicitud no encontrada." } as RequestActionResult;
      }

      if (request.status !== "PENDING") {
        return { success: false, error: "La solicitud ya fue resuelta." } as RequestActionResult;
      }

      const requestedDays =
        request.type === "VACATION"
          ? await businessDaysBetweenWithChileHolidays(request.startDate, request.endDate)
          : inclusiveDaysBetween(request.startDate, request.endDate);

      if (params.status === "APPROVED" && request.type === "VACATION") {
        if (!request.employee) {
          return { success: false, error: "Empleado no asociado a la solicitud." };
        }

        if (request.employee.vacationSaldo < requestedDays) {
          return {
            success: false,
            error: `Saldo insuficiente. Necesitas ${requestedDays} días hábiles y el saldo es ${request.employee.vacationSaldo}.`,
          };
        }

        await tx.employee.update({
          where: { id: request.employee.id },
          data: { vacationSaldo: { decrement: requestedDays } },
        });
      }

      await tx.leaveRequest.update({
        where: { id: parsed.data.id },
        data: {
          status: params.status,
          decisionNote: parsed.data.note ?? null,
          decisionAt: new Date(),
          decisionBy: session.userId,
        },
      });

      return {
        success: true,
        employeeId: request.employee?.id,
        notification: request.employee
          ? {
              id: request.id,
              startDate: request.startDate,
              endDate: request.endDate,
              type: request.type,
              comment: request.comment,
              decisionNote: parsed.data.note ?? null,
              status: params.status,
              businessDays: requestedDays,
              employee: {
                fullName: request.employee.fullName,
                area: request.employee.area,
                position: request.employee.position,
                email: request.employee.personalEmail ?? request.employee.user.email,
              },
            }
          : undefined,
      } as RequestActionResult;
    });

    if (!result.success) {
      return result;
    }

    // Revalidamos las vistas que dependen del estado de las solicitudes.
    revalidatePath("/requests");
    revalidatePath("/dashboard");
    revalidatePath("/employees");
    revalidatePath("/calendar");
    revalidatePath("/schedules");
    revalidatePath("/my-schedule");

    const employeeId = "employeeId" in result ? result.employeeId : undefined;
    if (employeeId) {
      revalidatePath(`/employees/${employeeId}`);
    }

    if ("notification" in result && result.notification) {
      const mailResult = await notifyEmployeeLeaveDecision(result.notification);
      if (!mailResult.ok) {
        return { success: true, employeeId, notificationWarning: mailResult.error };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Request action error:", error);
    return { success: false, error: "No se pudo actualizar la solicitud." };
  }
}

export async function approveLeaveRequest(id: string, note?: string): Promise<RequestActionResult> {
  return resolveLeaveRequest({ id, note, status: "APPROVED" });
}

export async function rejectLeaveRequest(id: string, note?: string): Promise<RequestActionResult> {
  return resolveLeaveRequest({ id, note, status: "REJECTED" });
}
