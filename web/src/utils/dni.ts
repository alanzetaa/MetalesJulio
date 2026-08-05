/**
 * Argentina no tiene una API pública para verificar que un DNI exista de
 * verdad (eso solo lo tiene RENAPER, acceso restringido) -- lo único que se
 * puede hacer del lado del cliente es rechazar patrones obviamente falsos
 * que la gente tipea para no poner su DNI real: todos los dígitos iguales
 * (11111111) o una secuencia estrictamente correlativa (12345678,
 * 87654321). Esto no confirma que un DNI sea real, solo descarta los casos
 * más obvios.
 */
export function esDniSospechoso(dni: string): boolean {
  if (!/^[0-9]{7,8}$/.test(dni)) return false;

  const digitos = dni.split("").map(Number);

  const todosIguales = digitos.every((d) => d === digitos[0]);
  if (todosIguales) return true;

  const ascendente = digitos.every((d, i) => i === 0 || d === digitos[i - 1] + 1);
  const descendente = digitos.every((d, i) => i === 0 || d === digitos[i - 1] - 1);

  return ascendente || descendente;
}
