import { z } from "zod";

export const chipIdSchema = z.string().regex(/^\d{15}$/, "Debe tener 15 dígitos");

export const weightSchema = z.object({
  weight_kg: z.coerce.number().positive("Debe ser mayor a 0"),
  weighed_at: z.string().min(1, "Fecha requerida"),
});

export const paddockSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  hectares: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), "Hectáreas inválidas"),
  notes: z.string().optional(),
});

export const animalSchema = z.object({
  chip_id: z.string().optional().nullable(),
  ear_tag: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  sex: z.enum(["M", "H"]),
  breed: z.string().optional().nullable(),
  birth_date: z.string().min(1, "Fecha de nacimiento requerida"),
  cost: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || !Number.isNaN(v), "Costo inválido"),
  status: z.enum(["vivo", "vendido", "muerto", "extraviado"]),
  notes: z.string().optional().nullable(),
  sire_id: z.string().optional().nullable(),
  dam_id: z.string().optional().nullable(),
  sire_external: z.string().optional().nullable(),
  dam_external: z.string().optional().nullable(),
  current_paddock_id: z.string().optional().nullable(),
});
