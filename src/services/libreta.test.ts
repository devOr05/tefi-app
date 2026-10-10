import { describe, expect, it } from 'vitest';
import { OnChainFiado } from '../solana/program';
import { buildLibreta, shortAddress } from './libreta';
import { calculateTotalActiveDebt } from './financialLedger';

const STORE = 'StoreWa11etAddre55StoreWa11etAddre55StoreWa1';
const NEIGHBOR = 'NeighborWa11etAddre55NeighborWa11etAddre55Ne';

const onChain = (address: string, overrides: Partial<OnChainFiado> = {}): OnChainFiado => ({
  address,
  merchant: STORE,
  customer: NEIGHBOR,
  amountUsdc: 2,
  dueTimestamp: 1_800_000_000,
  receiptHash: 'ab'.repeat(32),
  nonce: 0,
  status: 'ACTIVE',
  ...overrides
});

describe('buildLibreta', () => {
  it('monto, vencimiento y estado salen de la cadena; pesos, productos y foto del teléfono', () => {
    const [record] = buildLibreta({
      onChain: [onChain('fiado-1', { amountUsdc: 0.93, nonce: 4 })],
      details: { 'fiado-1': { amountArs: 1500, itemsDescription: 'Yerba 500g', photoReceiptUrl: 'data:image/jpeg;base64,xx', txSignature: 'sig-1' } },
      viewer: 'merchant',
      ownName: 'Almacén Don Tito',
      contactNames: { [NEIGHBOR]: 'Matías' },
      arsPerUsdc: 1600
    });

    expect(record).toMatchObject({
      id: 'fiado-1',
      merchantId: STORE,
      merchantName: 'Almacén Don Tito',
      customerId: NEIGHBOR,
      customerName: 'Matías',
      amountUsdc: 0.93,
      amountArs: 1500,
      itemsDescription: 'Yerba 500g',
      status: 'ACTIVE',
      nonce: 4,
      txSignature: 'sig-1',
      dueDate: new Date(1_800_000_000 * 1000).toISOString()
    });
  });

  it('un fiado que este teléfono no registró igual aparece, con pesos estimados y sin detalle', () => {
    const [record] = buildLibreta({
      onChain: [onChain('fiado-de-otro-almacen', { amountUsdc: 2, merchant: 'OtroAlmacenWa11etAddre55OtroAlmacenWa11etAdd' })],
      details: {},
      viewer: 'customer',
      ownName: 'Matías González',
      contactNames: {},
      arsPerUsdc: 1600
    });

    expect(record.amountArs).toBe(3200);
    expect(record.itemsDescription).toBe('');
    expect(record.customerName).toBe('Matías González');
    expect(record.merchantName).toBe(shortAddress('OtroAlmacenWa11etAddre55OtroAlmacenWa11etAdd'));
  });

  it('el vecino ve el nombre del almacén que guardó al firmar', () => {
    const [record] = buildLibreta({
      onChain: [onChain('fiado-1')],
      details: { 'fiado-1': { counterpartyName: 'Almacén Don Tito' } },
      viewer: 'customer',
      ownName: 'Matías González',
      contactNames: {},
      arsPerUsdc: 1600
    });
    expect(record.merchantName).toBe('Almacén Don Tito');
  });

  it('ordena: activos por vencimiento más cercano, saldados al final del más nuevo al más viejo', () => {
    const records = buildLibreta({
      onChain: [
        onChain('pagado-viejo', { status: 'PAID', nonce: 1 }),
        onChain('activo-lejano', { dueTimestamp: 1_900_000_000, nonce: 3 }),
        onChain('pagado-nuevo', { status: 'PAID', nonce: 5 }),
        onChain('activo-cercano', { dueTimestamp: 1_800_000_000, nonce: 4 })
      ],
      details: {},
      viewer: 'merchant',
      ownName: 'Almacén',
      contactNames: {},
      arsPerUsdc: 1600
    });
    expect(records.map(r => r.id)).toEqual(['activo-cercano', 'activo-lejano', 'pagado-nuevo', 'pagado-viejo']);
  });

  it('la deuda de la libreta coincide con la suma de los fiados activos on-chain', () => {
    const records = buildLibreta({
      onChain: [onChain('a', { amountUsdc: 0.93 }), onChain('b', { amountUsdc: 3 }), onChain('c', { amountUsdc: 12, status: 'PAID' })],
      details: {},
      viewer: 'customer',
      ownName: 'Matías',
      contactNames: {},
      arsPerUsdc: 1600
    });
    expect(calculateTotalActiveDebt(records)).toBe(3.93);
  });
});
