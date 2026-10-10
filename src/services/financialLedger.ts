import { FiadoRecord, CustomerProfile, FiadoStatus } from '../types/tefi';

/**
 * MOTOR FINANCIERO CANÓNICO DE AUDITORÍA Y RECONCILIACIÓN (TEFI.APP)
 *
 * Regla única de negocio:
 * 1. La deuda activa (activeDebt) es SIEMPRE la suma exacta de los registros cuyo status es 'ACTIVE'.
 * 2. Un fiado con status 'PAID', 'DEFAULTED' o 'INSURANCE_CLAIMED' NO suma a la deuda activa.
 * 3. Los importes deben ser números finitos estrictamente positivos (> 0).
 * 4. customer.currentDebt NUNCA puede diferir de la suma de sus fiados activos.
 * 5. Se previene la mutación optimista: una operación solo se asienta si está confirmada.
 */

export interface FiadoValidationResult {
  valid: boolean;
  error?: string;
}

export interface ReconciliationReport {
  reconciledCustomer: CustomerProfile;
  discrepancyDetected: boolean;
  storedDebt: number;
  calculatedDebt: number;
  difference: number;
}

/**
 * Calcula la deuda activa total en USDC a partir del listado canónico de fiados.
 */
export function calculateTotalActiveDebt(fiados: FiadoRecord[]): number {
  if (!Array.isArray(fiados)) return 0;
  const total = fiados
    .filter(f => f.status === 'ACTIVE')
    .reduce((sum, f) => {
      const amt = Number(f.amountUsdc);
      return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
    }, 0);
  return +(Math.round(total * 100) / 100).toFixed(2);
}

/**
 * Calcula el total pagado históricamente en USDC.
 */
export function calculateTotalRepaid(fiados: FiadoRecord[], baselineRepaid: number = 0): number {
  if (!Array.isArray(fiados)) return baselineRepaid;
  const repaidSum = fiados
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => {
      const amt = Number(f.amountUsdc);
      return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
    }, 0);
  const base = Number.isFinite(baselineRepaid) ? baselineRepaid : 0;
  return +(Math.round((repaidSum + base) * 100) / 100).toFixed(2);
}

/**
 * Valida un fiado individual antes de procesarlo o persistirlo.
 */
export function validateFiadoIntegrity(fiado: Partial<FiadoRecord>): FiadoValidationResult {
  if (!fiado) {
    return { valid: false, error: 'Registro de fiado nulo o indefinido.' };
  }
  if (!fiado.id || typeof fiado.id !== 'string' || fiado.id.trim() === '') {
    return { valid: false, error: 'El fiado carece de un identificador único válido.' };
  }
  const amtUsdc = Number(fiado.amountUsdc);
  if (!Number.isFinite(amtUsdc) || amtUsdc <= 0) {
    return { valid: false, error: `Importe inválido en USDC: ${fiado.amountUsdc}. Debe ser un número mayor a cero.` };
  }
  const validStatuses: FiadoStatus[] = ['ACTIVE', 'PAID', 'DEFAULTED', 'INSURANCE_CLAIMED'];
  if (!fiado.status || !validStatuses.includes(fiado.status)) {
    return { valid: false, error: `Estado de fiado desconocido: ${fiado.status}.` };
  }
  return { valid: true };
}

/**
 * Sanea, desduplica y valida una lista de fiados cruda (ej. la copia local leída desde localStorage).
 */
export function sanitizeAndValidateFiados(raw: any[]): { fiados: FiadoRecord[]; issues: string[] } {
  const issues: string[] = [];
  if (!Array.isArray(raw)) {
    return { fiados: [], issues: ['Los datos recibidos no son un arreglo de fiados válido.'] };
  }

  const seenIds = new Set<string>();
  const sanitized: FiadoRecord[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') {
      issues.push(`Ítem en posición ${i} es inválido o corrupto.`);
      continue;
    }

    const check = validateFiadoIntegrity(item);
    if (!check.valid) {
      issues.push(`Ítem ${item.id || i}: ${check.error}`);
      continue;
    }

    // Desduplicación estricta por ID
    if (seenIds.has(item.id)) {
      issues.push(`Fiado duplicado descartado: ${item.id}`);
      continue;
    }
    seenIds.add(item.id);

    const amtUsdc = +(Math.round(Number(item.amountUsdc) * 100) / 100).toFixed(2);
    const amtArs = Number(item.amountArs);

    sanitized.push({
      id: String(item.id),
      merchantId: String(item.merchantId || ''),
      merchantName: String(item.merchantName || ''),
      customerId: String(item.customerId || ''),
      customerName: String(item.customerName || ''),
      amountUsdc: amtUsdc,
      amountArs: Number.isFinite(amtArs) && amtArs > 0 ? amtArs : 0,
      itemsDescription: String(item.itemsDescription || ''),
      photoReceiptUrl: String(item.photoReceiptUrl || ''),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      dueDate: typeof item.dueDate === 'string' ? item.dueDate : '',
      status: item.status as FiadoStatus,
      nonce: typeof item.nonce === 'number' ? item.nonce : undefined,
      receiptHash: typeof item.receiptHash === 'string' ? item.receiptHash : undefined,
      txSignature: typeof item.txSignature === 'string' && item.txSignature ? item.txSignature : undefined,
      repayTxSignature: typeof item.repayTxSignature === 'string' && item.repayTxSignature ? item.repayTxSignature : undefined,
      repaidAt: typeof item.repaidAt === 'string' ? item.repaidAt : undefined
    });
  }

  return { fiados: sanitized, issues };
}

/**
 * Reconcilia el perfil del cliente contra los fiados activos reales.
 * Garantiza que customer.currentDebt coincida exactamente con la suma de fiados activos.
 */
export function reconcileCustomerWithFiados(
  customer: CustomerProfile,
  fiados: FiadoRecord[]
): ReconciliationReport {
  const calculatedDebt = calculateTotalActiveDebt(fiados);
  const storedDebt = Number.isFinite(Number(customer.currentDebt)) ? +(Number(customer.currentDebt)).toFixed(2) : 0;
  const diff = +(Math.abs(storedDebt - calculatedDebt)).toFixed(2);
  const discrepancyDetected = diff > 0.01;

  if (discrepancyDetected) {
    console.warn(
      `[Tefi Auditoría Financiera] Discrepancia detectada en libreta: Almacenado=$${storedDebt} USDC, Calculado=$${calculatedDebt} USDC (Diferencia=$${diff}). Reconciliando al valor canónico.`
    );
  }

  const reconciledCustomer: CustomerProfile = {
    ...customer,
    currentDebt: calculatedDebt
  };

  return {
    reconciledCustomer,
    discrepancyDetected,
    storedDebt,
    calculatedDebt,
    difference: diff
  };
}
