import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RATE_LIMIT_PACING, withRateLimitRetry } from './rpcRetry';

const RPC_URL = 'https://api.devnet.solana.com';
const rpcBody = (method: string) => JSON.stringify({ jsonrpc: '2.0', id: 1, method });
const post = (method: string): RequestInit => ({ method: 'POST', body: rpcBody(method) });
const rateLimited = () => new Response('{"error":{"code":429,"message":"Connection rate limits exceeded"}}', { status: 429 });
const ok = () => new Response('{"jsonrpc":"2.0","result":"ok","id":1}', { status: 200 });

const { firstGapMs, maxRejectionsPerRequest } = RATE_LIMIT_PACING;

// Nodo simulado: devuelve las respuestas en orden y anota qué pedido recibió y en qué momento
function setUp(responses: Array<() => Response>, jitter = 1) {
  const bodies: string[] = [];
  const sentAt: number[] = [];
  const fetchImpl: typeof fetch = async (_input, init) => {
    bodies.push(String(init?.body));
    sentAt.push(Date.now());
    return (responses[bodies.length - 1] ?? ok)();
  };
  return { bodies, sentAt, rpcFetch: withRateLimitRetry(fetchImpl, { jitter: () => jitter }) };
}

// Deja correr el reloj simulado hasta que el pedido termina
async function settle<T>(pending: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return pending;
}

describe('withRateLimitRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes a successful response through without waiting', async () => {
    const { sentAt, rpcFetch } = setUp([ok]);
    const response = await settle(rpcFetch(RPC_URL, post('getBalance')));

    expect(response.status).toBe(200);
    expect(sentAt).toEqual([0]);
  });

  it('repeats the same request after a 429, waiting twice as long after each new rejection', async () => {
    const { bodies, sentAt, rpcFetch } = setUp([rateLimited, rateLimited, ok]);
    const response = await settle(rpcFetch(RPC_URL, post('sendTransaction')));

    expect(response.status).toBe(200);
    expect(bodies).toEqual(Array(3).fill(rpcBody('sendTransaction')));
    expect(sentAt).toEqual([0, firstGapMs, firstGapMs * 3]);
  });

  it('gives up after enough rejections and hands the 429 back to the caller', async () => {
    const { sentAt, rpcFetch } = setUp(Array(20).fill(rateLimited));
    const response = await settle(rpcFetch(RPC_URL, post('getLatestBlockhash')));

    expect(response.status).toBe(429);
    expect(sentAt).toHaveLength(maxRejectionsPerRequest);
    // Insistió durante más tiempo que la ventana de 10 segundos del nodo público
    expect(sentAt[sentAt.length - 1]).toBeGreaterThanOrEqual(10_000);
  });

  it('applies the jitter factor to the wait after a rejection', async () => {
    const { sentAt, rpcFetch } = setUp([rateLimited, rateLimited, ok], 0.5);
    await settle(rpcFetch(RPC_URL, post('getBalance')));

    expect(sentAt).toEqual([0, firstGapMs / 2, firstGapMs * 1.5]);
  });

  it('spaces out every request of the phone after a rejection and speeds up again as the node accepts them', async () => {
    const { sentAt, rpcFetch } = setUp([rateLimited]);

    // El primero es rechazado una vez; los demás nunca lo fueron y aun así salen separados
    for (const method of ['getSignatureStatuses', 'getAccountInfo', 'getProgramAccounts', 'getBalance', 'getLatestBlockhash']) {
      await settle(rpcFetch(RPC_URL, post(method)));
    }

    expect(sentAt).toEqual([0, 1000, 2000, 2500, 2750, 2750]);
  });

  it('counts the requests rejected in one burst as a single rejection: they retry one at a time, not all at once', async () => {
    const { sentAt, rpcFetch } = setUp([rateLimited, rateLimited, rateLimited]);

    // Los tres pedidos de una sincronización salen juntos y el nodo rechaza los tres
    const responses = await settle(
      Promise.all(['getAccountInfo', 'getProgramAccounts', 'getBalance'].map(method => rpcFetch(RPC_URL, post(method))))
    );

    expect(responses.map(r => r.status)).toEqual([200, 200, 200]);
    // La espera no se triplicó por los tres rechazos, y cada reintento sale más cerca del anterior a medida que el nodo acepta
    expect(sentAt).toEqual([0, 0, 0, firstGapMs, firstGapMs * 2, firstGapMs * 2.5]);
  });

  it('does not repeat a faucet request: the airdrop quota does not clear by insisting', async () => {
    const { sentAt, rpcFetch } = setUp([rateLimited, ok]);
    const response = await settle(rpcFetch(RPC_URL, post('requestAirdrop')));

    expect(response.status).toBe(429);
    expect(sentAt).toEqual([0]);
  });

  it('does not retry other failures', async () => {
    const { sentAt, rpcFetch } = setUp([() => new Response('bad gateway', { status: 502 }), ok]);
    const response = await settle(rpcFetch(RPC_URL, post('getBalance')));

    expect(response.status).toBe(502);
    expect(sentAt).toEqual([0]);
  });
});
