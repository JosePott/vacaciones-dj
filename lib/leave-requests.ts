import type { RequestType } from "@prisma/client";

export const requestTypeLabels: Record<RequestType, string> = {
  VACATION: "Vacaciones",
  DAY_OFF: "Dia libre",
};

export const requestTypeScheduleLabels: Record<RequestType, string> = {
  VACATION: "Vacaciones",
  DAY_OFF: "Dia libre aprobado",
};

export function requestTypeBlocksScheduleMessage(type: RequestType) {
  if (type === "DAY_OFF") {
    return "Esta persona tiene un dia libre aprobado, no se le puede asignar horario.";
  }

  return "Esta persona esta de vacaciones, no se le puede asignar horario.";
}

export function requestDaysLabel(type: RequestType, days: number) {
  return type === "DAY_OFF" ? `${days} dia${days === 1 ? "" : "s"}` : `${days} dias habiles`;
}
