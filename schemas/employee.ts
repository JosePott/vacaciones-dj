import { z } from "zod";

const employeeBaseSchema = z.object({
  fullName: z.string().trim().min(1, "Nombre requerido"),
  email: z.string().email("Email invalido"),
  personalEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .pipe(z.string().email("Email personal invalido").optional()),
  area: z.string().trim().min(1, "Area requerida"),
  position: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  vacationSaldo: z.coerce.number().int().min(0).default(15),
  isActive: z.coerce.boolean().default(true),
  password: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
});

export const employeeCreateSchema = employeeBaseSchema;

export const employeeUpdateSchema = employeeBaseSchema.extend({
  id: z.string().trim().min(1, "ID requerido"),
});
