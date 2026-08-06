import { z } from "zod";
import { esCuitValido } from "../../utils/cuit";
import { esDniSospechoso } from "../../utils/dni";

export const perfilSchema = z.object({
  nombre: z.string().min(1, "Campo obligatorio"),
  apellido: z.string().min(1, "Campo obligatorio"),
  dni: z
    .string()
    .regex(/^[0-9]{7,8}$/, "7 u 8 números, sin puntos")
    .refine((v) => !esDniSospechoso(v), { message: "Ese DNI no parece real, revisalo" }),
  cuit: z
    .string()
    .optional()
    .refine((v) => !v || esCuitValido(v), { message: "El CUIT no es válido" }),
  ubicacion: z.string().optional(),
  descripcion: z.string().max(300, "Máximo 300 caracteres").optional(),
  paisCelular: z.string(),
  celular: z.string().optional(),
  notificarMensajes: z.boolean(),
  terminosAceptados: z
    .boolean()
    .refine((v) => v === true, { message: "Tenés que aceptar los Términos y Condiciones para continuar" }),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;
