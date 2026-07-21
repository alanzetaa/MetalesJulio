import { z } from "zod";

export const publicacionSchema = z.object({
  titulo: z.string().min(1, "Campo obligatorio"),
  categoria: z.string().min(1, "Elegí un rubro"),
  descripcion: z.string().optional(),
});

export type PublicacionFormValues = z.infer<typeof publicacionSchema>;
