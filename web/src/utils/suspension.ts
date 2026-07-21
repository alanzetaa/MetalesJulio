type ConSuspension = { suspendido_hasta: string | null };

export function isSuspended(entity: ConSuspension | null | undefined): boolean {
  return Boolean(entity?.suspendido_hasta && new Date(entity.suspendido_hasta) > new Date());
}
