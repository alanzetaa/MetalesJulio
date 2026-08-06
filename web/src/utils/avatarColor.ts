// Paleta fija para que cada persona tenga siempre el mismo color de avatar
// (calculado a partir de su nombre, no random) -- así "Fede R." se ve
// igual en Mensajes como en cualquier otro lado que use este mismo cálculo.
const AVATAR_COLORS = [
  "#b3986a", "#6d28d9", "#0e7490", "#b45309", "#be185d", "#15803d", "#1d4ed8", "#a21caf",
];

export function avatarColor(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
