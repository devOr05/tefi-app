// Reintento y regulación del ritmo ante el límite de uso del nodo RPC.
// El nodo público de devnet acepta unos 40 pedidos cada 10 segundos por IP. Esa cuenta la comparten todos los
// teléfonos que salen por la misma red (el almacén y los vecinos conectados a su Wi-Fi) e incluye los pedidos
// rechazados: un teléfono que insiste sin esperar mantiene bloqueada a toda la red.
// Un 429 no es una falla de la operación, porque el pedido no llegó a procesarse. Se repite, pero separando
// TODOS los pedidos de este teléfono; la separación se acorta de a poco cuando el nodo vuelve a aceptar.

type FetchLike = typeof fetch;

export const RATE_LIMIT_PACING = {
  /** Separación entre pedidos después del primer rechazo; se duplica con cada rechazo nuevo. */
  firstGapMs: 1000,
  maxGapMs: 8000,
  /** Con cada pedido aceptado la separación se multiplica por este factor... */
  recovery: 0.5,
  /** ...y por debajo de este valor se vuelve a enviar sin separación. */
  minGapMs: 250,
  /** Rechazos que tolera un mismo pedido antes de devolverle el 429 a quien lo hizo (unos 15 segundos). */
  maxRejectionsPerRequest: 5
};

export interface RateLimitRetryOptions {
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Factor aleatorio de la espera tras un rechazo, para que varios teléfonos no reintenten en el mismo instante. */
  jitter?: () => number;
}

// El faucet tiene un cupo propio de airdrops: repetir el pedido no lo destraba y deja al usuario esperando
const isAirdropRequest = (init?: RequestInit): boolean =>
  typeof init?.body === 'string' && init.body.includes('"requestAirdrop"');

export function withRateLimitRetry(fetchImpl: FetchLike, options: RateLimitRetryOptions = {}): FetchLike {
  const { firstGapMs, maxGapMs, recovery, minGapMs, maxRejectionsPerRequest } = RATE_LIMIT_PACING;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const now = options.now ?? Date.now;
  const jitter = options.jitter ?? (() => 0.75 + Math.random() * 0.5);

  let gap = 0; // separación vigente entre pedidos de este teléfono; 0 = sin restricción
  let nextSlot = 0; // momento a partir del cual puede salir el próximo pedido
  let lastSlowdownAt = -1;

  // Cada pedido espera su turno; el que sale deja reservada la separación para el siguiente
  const waitForTurn = async () => {
    for (;;) {
      const wait = nextSlot - now();
      if (wait <= 0) break;
      await sleep(wait);
    }
    nextSlot = now() + gap;
  };

  return async (input, init) => {
    const isExempt = isAirdropRequest(init);
    let rejections = 0;

    for (;;) {
      if (!isExempt) await waitForTurn();
      const sentAt = now();
      const response = await fetchImpl(input, init);

      // Los pedidos que ya estaban en vuelo cuando se bajó el ritmo no lo vuelven a mover (sentAt <= lastSlowdownAt)
      if (response.status !== 429) {
        if (sentAt > lastSlowdownAt) gap = gap * recovery < minGapMs ? 0 : Math.round(gap * recovery);
        return response;
      }

      rejections += 1;
      if (isExempt || rejections >= maxRejectionsPerRequest) return response;
      // Se descarta el cuerpo del rechazo para liberar la conexión antes de repetir el pedido
      await response.text().catch(() => '');
      if (sentAt > lastSlowdownAt) {
        gap = Math.min(maxGapMs, Math.max(firstGapMs, gap * 2));
        lastSlowdownAt = now();
        nextSlot = lastSlowdownAt + Math.round(gap * jitter());
      }
    }
  };
}
