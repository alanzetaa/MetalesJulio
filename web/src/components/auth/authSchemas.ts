import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Ingresá un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Ingresá un email válido"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({
    password1: z.string().min(6, "Mínimo 6 caracteres"),
    password2: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((data) => data.password1 === data.password2, {
    message: "Las contraseñas no coinciden",
    path: ["password2"],
  });
export type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;
