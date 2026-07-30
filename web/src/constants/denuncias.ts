// Motivos fijos para denunciar a otro miembro (ver reglas.md, "Denuncias").
// El "value" tiene que coincidir con el check constraint de public.denuncias
// en supabase-schema.sql, y con ETIQUETAS_MOTIVO en la Edge Function
// notificar-denuncia (los 3 lugares se actualizan juntos si se agrega uno).
export const MOTIVOS_DENUNCIA = [
  { value: "estafa", label: "Estafa o intento de estafa" },
  { value: "producto_no_coincide", label: "El producto/trabajo no coincide con lo publicado" },
  { value: "lenguaje_inapropiado", label: "Lenguaje inapropiado o insultos" },
  { value: "acoso", label: "Acoso o comportamiento intimidante" },
  { value: "spam", label: "Spam o publicidad no relacionada" },
  { value: "otro", label: "Otro" },
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number]["value"];

export function etiquetaMotivo(motivo: string): string {
  return MOTIVOS_DENUNCIA.find((m) => m.value === motivo)?.label ?? motivo;
}
