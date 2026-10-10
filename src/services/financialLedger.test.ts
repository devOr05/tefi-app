import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerProfile, FiadoRecord, FiadoStatus } from '../types/tefi';
import {
  calculateTotalActiveDebt,
  calculateTotalRepaid,
  reconcileCustomerWithFiados,
  sanitizeAndValidateFiados,
  validateFiadoIntegrity
} from './financialLedger';

const fiado = (id: string, amountUsdc: number, status: FiadoStatus): FiadoRecord => ({
  id,
  merchantId: 'merchant',
  merchantName: 'Almacén Don Tito',
  customerId: 'customer',
  customerName: 'Matías González',
  amountUsdc,
  amountArs: Math.round(amountUsdc * 1500),
  itemsDescription: 'Compra de almacén',
  photoReceiptUrl: '',
  createdAt: '2026-10-01T12:00:00.000Z',
  dueDate: '2026-10-16T12:00:00.000Z',
  status
});

const customerWithDebt = (currentDebt: number): CustomerProfile => ({
  id: 'customer',
  name: 'Matías González',
  walletAddress: 'customer',
  hasOnChainProfile: true,
  creditScore: 65,
  maxCreditLimit: 50,
  currentDebt,
  totalRepaid: 0,
  loyaltyPoints: 0,
  tier: 'Plata'
});

describe('calculateTotalActiveDebt', () => {
  it('suma solo los fiados ACTIVE con monto válido', () => {
    const fiados = [
      fiado('f-1', 10.0, 'ACTIVE'),
      fiado('f-2', 5.5, 'ACTIVE'),
      fiado('f-3', 20.0, 'PAID'),
      fiado('f-4', 15.0, 'INSURANCE_CLAIMED'),
      fiado('f-5', 8.0, 'DEFAULTED'),
      fiado('f-negativo', -5.0, 'ACTIVE'),
      fiado('f-nan', Number.NaN, 'ACTIVE')
    ];
    expect(calculateTotalActiveDebt(fiados)).toBe(15.5);
  });

  it('redondea a centavos sin arrastrar errores de punto flotante', () => {
    expect(calculateTotalActiveDebt([fiado('a', 0.1, 'ACTIVE'), fiado('b', 0.2, 'ACTIVE')])).toBe(0.3);
    expect(calculateTotalActiveDebt([fiado('a', 0.94, 'ACTIVE'), fiado('b', 6.57, 'ACTIVE')])).toBe(7.51);
  });

  it('devuelve 0 si no recibe una lista', () => {
    expect(calculateTotalActiveDebt([])).toBe(0);
    expect(calculateTotalActiveDebt(undefined as unknown as FiadoRecord[])).toBe(0);
  });
});

describe('calculateTotalRepaid', () => {
  it('suma solo los fiados PAID más el acumulado previo', () => {
    const fiados = [fiado('f-1', 12, 'PAID'), fiado('f-2', 4, 'PAID'), fiado('f-3', 9, 'ACTIVE')];
    expect(calculateTotalRepaid(fiados)).toBe(16);
    expect(calculateTotalRepaid(fiados, 100.5)).toBe(116.5);
  });
});

describe('reconcileCustomerWithFiados', () => {
  // Cada discrepancia se registra con console.warn: se silencia para no ensuciar la salida de los tests
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detecta la discrepancia entre la cabecera y la libreta y la corrige al valor canónico', () => {
    const report = reconcileCustomerWithFiados(customerWithDebt(0.93), [fiado('f-1', 0.94, 'ACTIVE'), fiado('f-2', 6.57, 'ACTIVE')]);

    expect(console.warn).toHaveBeenCalledOnce();
    expect(report.discrepancyDetected).toBe(true);
    expect(report.storedDebt).toBe(0.93);
    expect(report.calculatedDebt).toBe(7.51);
    expect(report.difference).toBe(6.58);
    expect(report.reconciledCustomer.currentDebt).toBe(7.51);
  });

  it('no informa discrepancia cuando la deuda guardada coincide con los fiados activos', () => {
    const original = customerWithDebt(15.5);
    const report = reconcileCustomerWithFiados(original, [fiado('f-1', 10, 'ACTIVE'), fiado('f-2', 5.5, 'ACTIVE'), fiado('f-3', 20, 'PAID')]);

    expect(report.discrepancyDetected).toBe(false);
    expect(report.reconciledCustomer.currentDebt).toBe(15.5);
    expect(report.reconciledCustomer).not.toBe(original); // no muta el perfil recibido
  });

  it('un fiado saldado deja de contar como deuda', () => {
    const report = reconcileCustomerWithFiados(customerWithDebt(12), [fiado('f-1', 12, 'PAID')]);
    expect(report.reconciledCustomer.currentDebt).toBe(0);
  });
});

describe('validateFiadoIntegrity', () => {
  it('acepta un fiado completo', () => {
    expect(validateFiadoIntegrity(fiado('f-1', 3.5, 'ACTIVE'))).toEqual({ valid: true });
  });

  it('rechaza fiados sin id, sin monto positivo o con estado desconocido', () => {
    expect(validateFiadoIntegrity({ ...fiado('f-1', 3.5, 'ACTIVE'), id: ' ' }).valid).toBe(false);
    expect(validateFiadoIntegrity(fiado('f-1', 0, 'ACTIVE')).valid).toBe(false);
    expect(validateFiadoIntegrity(fiado('f-1', -2, 'ACTIVE')).valid).toBe(false);
    expect(validateFiadoIntegrity({ ...fiado('f-1', 3.5, 'ACTIVE'), status: 'PENDIENTE' as FiadoStatus }).valid).toBe(false);
    expect(validateFiadoIntegrity(null as unknown as FiadoRecord).valid).toBe(false);
  });
});

describe('sanitizeAndValidateFiados', () => {
  it('descarta duplicados y registros corruptos e informa cada descarte', () => {
    const raw = [
      fiado('f-101', 12.0, 'ACTIVE'),
      fiado('f-101', 12.0, 'ACTIVE'),
      fiado('f-102', 6.5, 'ACTIVE'),
      null,
      { id: 'f-103', amountUsdc: 'abc', status: 'ACTIVE' },
      { id: 'f-104', amountUsdc: 4, status: 'OTRO' }
    ];
    const { fiados, issues } = sanitizeAndValidateFiados(raw);

    expect(fiados.map(f => f.id)).toEqual(['f-101', 'f-102']);
    expect(issues).toHaveLength(4);
    expect(calculateTotalActiveDebt(fiados)).toBe(18.5);
  });

  it('normaliza montos a centavos y conserva las firmas de las transacciones', () => {
    const { fiados } = sanitizeAndValidateFiados([
      { ...fiado('f-1', 0.9349, 'PAID'), txSignature: 'sig-issue', repayTxSignature: 'sig-repay', nonce: 3 }
    ]);

    expect(fiados[0].amountUsdc).toBe(0.93);
    expect(fiados[0].txSignature).toBe('sig-issue');
    expect(fiados[0].repayTxSignature).toBe('sig-repay');
    expect(fiados[0].nonce).toBe(3);
  });

  it('no acepta datos que no sean una lista', () => {
    const { fiados, issues } = sanitizeAndValidateFiados({} as unknown as any[]);
    expect(fiados).toEqual([]);
    expect(issues).toHaveLength(1);
  });
});
