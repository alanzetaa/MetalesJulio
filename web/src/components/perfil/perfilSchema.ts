import { z } from "zod";

export const perfilSchema = z.object({
  nombre: z.string().min(1, "Campo obligatorio"),
  apellido: z.string().min(1, "Campo obligatorio"),
  dni: z.string().regex(/^[0-9]{7,8}$/, "7 u 8 números, sin puntos"),
  cuit: z.string().optional(),
  ubicacion: z.string().optional(),
  descripcion: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  contactoEmail: z.string().optional(),
  notificarMensajes: z.boolean(),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;
