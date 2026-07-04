import { z } from "zod";

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (AAAA-MM-DD).")
  .refine((value) => {
    const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const asUtc = new Date(Date.UTC(y, m - 1, d));
    return (
      asUtc.getUTCFullYear() === y &&
      asUtc.getUTCMonth() + 1 === m &&
      asUtc.getUTCDate() === d
    );
  }, "Fecha inválida.");

export const leaveRequestCreateSchema = z.object({
  type: z.enum(["VACATION", "DAY_OFF"], {
    message: "Tipo de solicitud invalido.",
  }),
  startDate: isoDateString,
  endDate: isoDateString,
  comment: z
    .string()
    .trim()
    .max(500, "La nota no puede exceder 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export const leaveRequestDecisionSchema = z.object({
  id: z.string().trim().min(1, "Solicitud invalida."),
  note: z
    .string()
    .trim()
    .max(500, "La nota no puede exceder 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});
