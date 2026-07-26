const MAX_ANCHO = 1600;
const MAX_ALTO = 1600;
const CALIDAD_JPEG = 0.82;

/**
 * Calcula el ancho/alto redimensionado sin pasarse de un máximo, manteniendo
 * la proporción original -- nunca agranda una imagen más chica que el
 * máximo (el mínimo con 1 evita eso). Separado de comprimirImagen() para
 * poder testearlo sin necesitar un navegador de verdad (canvas, etc.).
 */
export function calcularDimensionesRedimensionadas(
  anchoOriginal: number,
  altoOriginal: number,
  maxAncho: number = MAX_ANCHO,
  maxAlto: number = MAX_ALTO
): { ancho: number; alto: number } {
  const escala = Math.min(1, maxAncho / anchoOriginal, maxAlto / altoOriginal);
  return {
    ancho: Math.round(anchoOriginal * escala),
    alto: Math.round(altoOriginal * escala),
  };
}

/**
 * Redimensiona y comprime una foto en el navegador antes de subirla, sin
 * ninguna librería externa (Canvas nativo) -- ver reglas.md ("Compresión de
 * fotos"). Las fotos de un celular moderno son mucho más grandes de lo que
 * hace falta para verse bien en una card de la comunidad; esto acorta la
 * subida y la descarga sin que se note diferencia visual real.
 */
export async function comprimirImagen(file: File): Promise<File> {
  // Los GIF animados pierden la animación si se pasan por canvas -- se
  // suben tal cual. Lo mismo si el navegador no soporta createImageBitmap.
  if (file.type === "image/gif" || typeof createImageBitmap === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { ancho, alto } = calcularDimensionesRedimensionadas(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG));
    if (!blob || blob.size >= file.size) return file;

    const nuevoNombre = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], nuevoNombre, { type: "image/jpeg" });
  } catch {
    // Si algo falla (formato raro, navegador viejo, etc.) se sube la
    // original tal cual -- nunca bloquea la publicación por esto.
    return file;
  }
}
