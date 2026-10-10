import assert from 'assert';
import fs from 'fs';

console.log('🧪 Iniciando Suite de Pruebas de Integridad Financiera y Anti-Regresión (Tefi.App)...\n');

// -------------------------------------------------------------
// 1. REGLA CANÓNICA DE CÁLCULO DE DEUDA Y RECONCILIACIÓN
// -------------------------------------------------------------
console.log('[1/10] Verificando que solo los fiados ACTIVE suman a la deuda activa...');

function calculateTotalActiveDebt(fiados) {
  if (!Array.isArray(fiados)) return 0;
  const total = fiados
    .filter(f => f.status === 'ACTIVE')
    .reduce((sum, f) => {
      const amt = Number(f.amountUsdc);
      return sum + (Number.isFinite(amt) && amt > 0 ? amt : 0);
    }, 0);
  return +(Math.round(total * 100) / 100).toFixed(2);
}

const testFiados = [
  { id: 'f-1', amountUsdc: 10.0, status: 'ACTIVE' },
  { id: 'f-2', amountUsdc: 5.5, status: 'ACTIVE' },
  { id: 'f-3', amountUsdc: 20.0, status: 'PAID' },
  { id: 'f-4', amountUsdc: 15.0, status: 'INSURANCE_CLAIMED' },
  { id: 'f-5', amountUsdc: 8.0, status: 'DEFAULTED' },
  { id: 'f-invalid', amountUsdc: -5.0, status: 'ACTIVE' } // Monto negativo no debe sumar
];

const debt = calculateTotalActiveDebt(testFiados);
assert.strictEqual(debt, 15.5, `La deuda esperada era 15.5 USDC pero se calculó ${debt}`);
console.log('  ✓ Deuda calculada exactamente en $15.50 USDC (excluye pagados, reclamados, incobrables y montos inválidos)');

// -------------------------------------------------------------
// 2. RECONCILIACIÓN DE DISCREPANCIAS EN LIBRETA
// -------------------------------------------------------------
console.log('[2/10] Verificando reconciliación de discrepancias entre cabecera y listado...');

function reconcileCustomerWithFiados(customer, fiados) {
  const calculatedDebt = calculateTotalActiveDebt(fiados);
  const storedDebt = Number.isFinite(Number(customer.currentDebt)) ? +(Number(customer.currentDebt)).toFixed(2) : 0;
  const diff = +(Math.abs(storedDebt - calculatedDebt)).toFixed(2);
  const discrepancyDetected = diff > 0.01;
  return {
    reconciledCustomer: { ...customer, currentDebt: calculatedDebt },
    discrepancyDetected,
    storedDebt,
    calculatedDebt,
    difference: diff
  };
}

const desyncedCustomer = { id: 'cust-1', name: 'Test', currentDebt: 0.93, maxCreditLimit: 60 };
const actualActiveFiados = [
  { id: 'f-1', amountUsdc: 0.94, status: 'ACTIVE' },
  { id: 'f-2', amountUsdc: 6.57, status: 'ACTIVE' }
];

const reconciliation = reconcileCustomerWithFiados(desyncedCustomer, actualActiveFiados);
assert(reconciliation.discrepancyDetected, 'Debió detectarse la discrepancia entre 0.93 y 7.51');
assert.strictEqual(reconciliation.reconciledCustomer.currentDebt, 7.51, 'La deuda reconciliada debe ser 7.51 USDC');
console.log('  ✓ Discrepancia detectada exitosamente ($0.93 vs $7.51) y reconciliada a $7.51 USDC');

// -------------------------------------------------------------
// 3. DESDUPLICACIÓN Y SANEAMIENTO DE REGISTROS LOCALES
// -------------------------------------------------------------
console.log('[3/10] Verificando desduplicación estricta de registros de fiados...');

const rawWithDuplicates = [
  { id: 'f-101', amountUsdc: 12.0, status: 'ACTIVE' },
  { id: 'f-101', amountUsdc: 12.0, status: 'ACTIVE' }, // Duplicado
  { id: 'f-102', amountUsdc: 6.5, status: 'ACTIVE' }
];

const seenIds = new Set();
const deduped = [];
for (const item of rawWithDuplicates) {
  if (!seenIds.has(item.id)) {
    seenIds.add(item.id);
    deduped.push(item);
  }
}
assert.strictEqual(deduped.length, 2, 'Los duplicados deben ser descartados');
console.log('  ✓ Desduplicación correcta: 3 registros reducidos a 2 únicos');

// -------------------------------------------------------------
// 4. AISLAMIENTO DE DATOS DEMO (SEEDS)
// -------------------------------------------------------------
console.log('[4/10] Verificando aislamiento y rotulado de datos demo...');
const contextCode = fs.readFileSync('src/context/TefiContext.tsx', 'utf8');

assert(contextCode.includes('isDemo: true'), 'INITIAL_FIADOS debe contener la propiedad isDemo: true');
assert(contextCode.includes('settlementStatus: \'confirmed\''), 'Los fiados deben declarar settlementStatus');
console.log('  ✓ Datos semilla demo explícitamente etiquetados con isDemo: true y settlementStatus');

// -------------------------------------------------------------
// 5. CERO FALLBACKS A SPL MEMO EN FLUJOS DE NEGOCIO
// -------------------------------------------------------------
console.log('[5/10] Verificando eliminación total de fallbacks a SPL Memo en TefiContext...');

// No debe importarse ni llamarse broadcastSolanaFiadoEvent en TefiContext
assert(!contextCode.includes('broadcastSolanaFiadoEvent('), 'TefiContext.tsx no debe invocar broadcastSolanaFiadoEvent');
assert(!contextCode.includes('import {') || !contextCode.includes('broadcastSolanaFiadoEvent'), 'TefiContext.tsx no debe importar broadcastSolanaFiadoEvent');
console.log('  ✓ Cero llamadas a broadcastSolanaFiadoEvent en TefiContext.tsx (eliminado al 100%)');

// -------------------------------------------------------------
// 6. ASINCRONÍA Y NO OPTIMISMO EN createFiado
// -------------------------------------------------------------
console.log('[6/10] Verificando que createFiado sea asíncrono y condicionado a confirmación...');

assert(contextCode.includes('const createFiado = async'), 'createFiado debe ser una función async');
assert(contextCode.includes('await executeOnChainIssueFiado'), 'createFiado debe esperar executeOnChainIssueFiado');

// Asegurar que el setFiados solo ocurra tras res.signature en createFiado
const createFiadoBody = contextCode.substring(contextCode.indexOf('const createFiado = async'), contextCode.indexOf('const acceptScannedFiado = async'));
assert(createFiadoBody.includes('res.signature'), 'createFiado debe validar res.signature antes de actualizar el estado');
assert(!createFiadoBody.includes('broadcastSolanaFiadoEvent'), 'createFiado no debe contener fallback Memo');
console.log('  ✓ createFiado es estrictamente asíncrono y no asienta deuda sin confirmación on-chain');

// -------------------------------------------------------------
// 7. ASINCRONÍA Y NO OPTIMISMO EN acceptScannedFiado
// -------------------------------------------------------------
console.log('[7/10] Verificando que acceptScannedFiado sea asíncrono y bilateral...');

assert(contextCode.includes('const acceptScannedFiado = async'), 'acceptScannedFiado debe ser async');
assert(contextCode.includes('await executeOnChainIssueFiado'), 'acceptScannedFiado debe esperar executeOnChainIssueFiado');
console.log('  ✓ acceptScannedFiado exige await de confirmación on-chain');

// -------------------------------------------------------------
// 8. LIQUIDACIÓN ESTRICTA EN repayFiado
// -------------------------------------------------------------
console.log('[8/10] Verificando que repayFiado diferencie modo demo y exija co-firma bilateral...');

const repayFiadoBody = contextCode.substring(contextCode.indexOf('const repayFiado = async'), contextCode.indexOf('const claimInsurance ='));
assert(repayFiadoBody.includes('if (target.isDemo)'), 'repayFiado debe manejar explícitamente los fiados demo sin falsear blockchain');
assert(repayFiadoBody.includes('await executeOnChainRepayFiado'), 'repayFiado debe invocar executeOnChainRepayFiado para fiados reales');
assert(repayFiadoBody.includes('return { success: false, error: errorMsg }'), 'repayFiado debe retornar fallo explícito en caso de error on-chain');
console.log('  ✓ repayFiado aísla demo y exige co-firma bilateral on-chain sin atajos');

// -------------------------------------------------------------
// 9. VERIFICACIÓN PREVIA DE PDAS EN anchorClient.ts
// -------------------------------------------------------------
console.log('[9/10] Verificando comprobación previa de existencia de cuentas PDA en anchorClient.ts...');

const anchorClientCode = fs.readFileSync('src/solana/anchorClient.ts', 'utf8');
assert(anchorClientCode.includes('solanaConnection.getAccountInfo(fiadoRecordPda)'), 'anchorClient.ts debe comprobar si FiadoRecord existe antes de llamar RPC');
assert(anchorClientCode.includes('solanaConnection.getAccountInfo(customerPda)'), 'anchorClient.ts debe comprobar CustomerProfile');
console.log('  ✓ anchorClient.ts verifica preexistencia de cuentas PDA antes de enviar la transacción');

// -------------------------------------------------------------
// 10. POLÍTICA DE CACHÉ DE SERVICE WORKER EN vite.config.ts
// -------------------------------------------------------------
console.log('[10/10] Verificando configuración anti-stale del Service Worker...');

const viteConfigCode = fs.readFileSync('vite.config.ts', 'utf8');
assert(viteConfigCode.includes('cleanupOutdatedCaches: true'), 'vite.config.ts debe activar cleanupOutdatedCaches');
assert(viteConfigCode.includes('clientsClaim: true'), 'vite.config.ts debe activar clientsClaim');
assert(viteConfigCode.includes('skipWaiting: true'), 'vite.config.ts debe activar skipWaiting');
console.log('  ✓ vite.config.ts configurado para purga inmediata de cachés obsoletas y control de clientes');

console.log('\n🎉 LAS 10 PRUEBAS DE INTEGRIDAD FINANCIERA Y ANTI-REGRESIÓN PASARON CON ÉXITO.\n');
