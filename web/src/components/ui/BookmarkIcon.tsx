/**
 * Ícono de guardar/favorito propio (SVG, sin librerías) en vez del emoji
 * 🔖 que se usaba antes -- ver reglas.md ("Publicaciones guardadas"). Los
 * emoji a color ignoran la propiedad "color" de CSS, así que no alcanzaba
 * con cambiar el color para marcar guardado/no guardado (eso ya se había
 * intentado y seguía "pareciendo lo mismo"). Un SVG con `fill` y `stroke`
 * en `currentColor` sí responde al color del botón, y además cambia de
 * forma (contorno vacío vs relleno sólido) — mismo patrón que el corazón
 * ♡/♥ del like, pero para un ícono que no tiene un equivalente de texto
 * plano en Unicode.
 */
export function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3a2 2 0 0 0-2 2v16l8-5 8 5V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}
