export function csvEscape(valor: unknown): string {
  let s = valor === null || valor === undefined ? "" : String(valor);
  if (/["\n,]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Arma el contenido de un .csv, con BOM al principio para que Excel abra
 * bien los acentos/ñ en UTF-8 (si se toca esto, no reemplazar
 * String.fromCharCode(0xfeff) por el caracter literal pegado en el código
 * fuente — es invisible y se puede corromper fácil al editar el archivo con
 * otra herramienta).
 */
export function buildCsv(headers: string[], filas: unknown[][]): string {
  const lineas = filas.map((fila) => fila.map(csvEscape).join(","));
  const bom = String.fromCharCode(0xfeff);
  return bom + [headers.join(","), ...lineas].join("\r\n");
}

/** Dispara la descarga de un .csv en el navegador (sin ninguna librería). */
export function descargarCsv(nombreArchivo: string, headers: string[], filasDeArrays: unknown[][]): void {
  const csv = buildCsv(headers, filasDeArrays);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
