/**
 * Solo hay que avisar si YA sabíamos el valor anterior (no en el primer
 * valor que llega, recién montado el hook) y el nuevo valor es más alto
 * que el anterior (mensaje nuevo, no una baja por marcar como leído).
 */
export function deberiaAvisarPorAumento(anterior: number | null, actual: number): boolean {
  return anterior != null && actual > anterior;
}
