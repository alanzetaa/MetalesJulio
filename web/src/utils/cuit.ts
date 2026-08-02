/**
 * Valida el dígito verificador del CUIT/CUIL argentino (algoritmo mod 11,
 * el mismo que usa AFIP/ARCA) — mismo criterio que el validador de Biddit.
 * Acepta el valor con o sin guiones/espacios.
 */
export function esCuitValido(valor: string): boolean {
  const limpio = valor.replace(/\D/g, "");
  if (limpio.length !== 11) return false;

  const digitos = limpio.split("").map(Number);
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = digitos.slice(0, 10).reduce((acc, d, i) => acc + d * multiplicadores[i], 0);
  const resto = suma % 11;
  let verificador = 11 - resto;
  if (verificador === 11) verificador = 0;
  if (verificador === 10) return false;

  return verificador === digitos[10];
}
