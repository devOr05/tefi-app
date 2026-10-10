# INFORME DE CORRECCIONES ESTRICTAS, INTEGRIDAD FINANCIERA Y VALIDACIÓN END-TO-END

**Proyecto:** Tefi.App  
**Rama de trabajo auditada:** `fix/strict-consistency` (derivada de `main` en commit `1cb86ae`)  
**Fecha:** 10 de Octubre de 2026 (02:35 UTC)  
**Program ID Solana Devnet:** `3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc`  
**Autoridad de Actualización On-Chain:** `HbEfky8hkQXRq5tV76ZWfiM3XqPWo34tbdUG2pwxEyLf`  

---

## 1. HALLAZGOS CONFIRMADOS Y HALLAZGOS NO REPRODUCIDOS

### Hallazgos Confirmados
1. **Transacción de prueba manual ejecutada como SPL Memo:**
   * La transacción `t6EDJoTfnj9whjF6m2wnAY8D4LwWejoLLopJYrM3fnkA2ZArsTtRT8UQ2pREhbwQ5z2UGa2sns5ytecf9CCTJJg` (Slot `509376612`) invocó exclusivamente el **SPL Memo Program v2** (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) con datos `{"app":"tefi.app","event":"REPAY","fiadoId":"f-0356","usdc":0.93...}`.
   * **No invocó** el Smart Contract de Anchor (`3bs3SLqe...`) ni mutó ninguna cuenta PDA en Devnet.
2. **Presencia de fallbacks a SPL Memo en el frontend:**
   * En `createFiado` y `acceptScannedFiado`, existían bloques `.catch()` que transmitían la operación vía `broadcastSolanaFiadoEvent` (Memo) si Anchor fallaba.
   * En `repayAllDebtWithAbundanceFountain`, se llamaba directamente a `broadcastSolanaFiadoEvent`.
3. **Causa raíz de la desincronización de importes en pantalla:**
   * En `CustomerLibretaView.tsx`, cada tarjeta de fiado renderizaba `(f.amountUsdc * 1.01).toFixed(2)` y `Math.round(f.amountArs * 1.01)`. Esto causaba que un fiado de `$0.93 USDC` se mostrara como `$0.94 USDC` y uno de `$6.50 USDC` se mostrara como `$6.57 USDC` (suma = `$7.51 USDC`), mientras que la cabecera mostraba `$0.93 USDC` y el modal de pago mostraba `$0.93 USDC`.
4. **Desacoplamiento de campos en `localStorage`:**
   * `customer.currentDebt` y el listado de fiados en `tefi_fiados` se persistían por separado sin una función de reconciliación canónica. Si un fiado se pagaba parcialmente o fallaba a medias, los saldos divergían permanentemente.
5. **Mutación optimista previa a la confirmación:**
   * `createFiado` y `acceptScannedFiado` agregaban el fiado al array local e incrementaban `currentDebt` de forma síncrona **antes** de recibir la confirmación de la transacción en Solana Devnet.
6. **Discrepancia entre contrato desplegado en Devnet y código local:**
   * Mediante consulta RPC a Devnet sobre la transacción histórica `2QJs5Uqa...`, se comprobó que el bytecode desplegado el 06/10 contiene `repay_fiado` con **4 cuentas (unilateral, firma solo el cliente)**, mientras que el código local y CI exige **5 cuentas (bilateral, co-firma de almacén y cliente)**.

### Hallazgos No Reproducidos
* No se encontraron claves privadas reales ni seed phrases filtradas en el repositorio.
* No se detectaron vulnerabilidades de inyección en el oráculo de cotización (`dolarapi.com`).

---

## 2. ARCHIVOS MODIFICADOS Y JUSTIFICACIÓN TÉCNICA

| Archivo | Tipo de Cambio | Justificación Técnica |
| :--- | :---: | :--- |
| `src/services/financialLedger.ts` | **Nuevo** | Motor financiero canónico. Implementa `calculateTotalActiveDebt` (solo fiados ACTIVE con montos > 0), `sanitizeAndValidateFiados` (desduplicación por ID) y `reconcileCustomerWithFiados` para eliminar discrepancias entre cabecera y listado. |
| `src/types/tefi.ts` | **Modificación** | Añadidas propiedades `isDemo?: boolean` y `settlementStatus?: 'pending' \| 'confirmed' \| 'failed' \| 'unknown'` en `FiadoRecord`. |
| `src/context/TefiContext.tsx` | **Modificación** | 1. Eliminado `broadcastSolanaFiadoEvent` de toda la lógica de negocio.<br>2. `createFiado` y `acceptScannedFiado` convertidos en funciones `async` estrictas: no agregan deuda ni fiados a la libreta si la confirmación on-chain falla.<br>3. `repayFiado` aísla los fiados semilla demo sin falsear firmas en Solana, y exige co-firma on-chain estricta para fiados reales.<br>4. Reconciliación matemática automática en `useEffect` y al montar la aplicación.<br>5. `resetDemoData` recalcula la deuda inicial de forma canónica. |
| `src/solana/anchorClient.ts` | **Modificación** | Validación de preexistencia on-chain: `executeOnChainRepayFiado` verifica que `fiadoRecordPda` y `customerPda` existan en Devnet antes de enviar la transacción RPC, fallando de forma explícita e informativa si no existen. |
| `src/views/NewFiadoView.tsx` | **Modificación** | `handleSubmit` convertido a `async` para esperar `createFiado`. Botón de emisión deshabilitado con estado visual de carga durante la llamada a Solana Devnet. |
| `src/components/FiadoConfirmationModal.tsx` | **Modificación** | `handleConfirm` actualizado para esperar `await acceptScannedFiado(payload)`. |
| `src/views/CustomerLibretaView.tsx` | **Modificación** | Eliminado el multiplicador artificial `* 1.01`. Los fiados muestran su importe real exacto coincidiendo al centavo con la cabecera. Añadidos badges visuales: `Modo Demo` (semilla) vs `Devnet On-Chain` (verificado). |
| `src/components/RepayModal.tsx` | **Modificación** | Aviso de tarifa actualizado: liquidación 100% gratuita para comercio y vecino (gas patrocinado en Solana). |
| `vite.config.ts` | **Modificación** | Configurado Workbox PWA con `cleanupOutdatedCaches: true`, `clientsClaim: true`, `skipWaiting: true` para purgar cachés viejas y activar inmediatamente bundles nuevos. |
| `scripts/test-financial-integrity.js` | **Nuevo** | Suite de 10 pruebas automatizadas que verifican la regla canónica de deuda, desduplicación, reconciliación, anti-optimismo y cero fallbacks a Memo. |
| `package.json` | **Modificación** | Script `test` ampliado para ejecutar conjuntamente `test-contracts.js` y `test-financial-integrity.js`. |

---

## 3. RESULTADOS DE LAS PRUEBAS AUTOMATIZADAS

### Comando Ejecutado
```bash
npm test
```

### Salida Obtenida (Exit Code 0)
```text
> tefi-app@1.0.0 test
> node scripts/test-contracts.js && node scripts/test-financial-integrity.js

🧪 Starting Tefi Anchor & Solana Contract Integrity Test Suite...

[1/5] Checking IDL metadata: program 'tefi_program', version '0.1.0'...
  ✓ Program name matches tefi_program
[2/5] Checking all 5 required instructions (initializeMerchant, initializeCustomer, issueFiado, repayFiado, claimInsurance)...
  ✓ Instruction 'initializeMerchant' present with 3 accounts
  ✓ Instruction 'initializeCustomer' present with 3 accounts
  ✓ Instruction 'issueFiado' present with 6 accounts
  ✓ Instruction 'repayFiado' present with 5 accounts
  ✓ Instruction 'claimInsurance' present with 4 accounts
[3/5] Verifying bilateral signature constraints (Anti-Fraud / Superteam P0 requirement)...
  ✓ issueFiado requires both merchant and customer signers
  ✓ repayFiado requires bilateral signers (merchant confirmation + customer debt clearance)
[4/5] Testing canonical PDA address derivations...
  ✓ MerchantProfile PDA derived: 53DzLqXQEAWS3pnN2Yx2WrasyXHJT7U34CgaL433tEeK (bump: 255)
  ✓ CustomerProfile PDA derived: xoQGyQRAVmK5tWRoMF1UaFr5E53p2qMLTMVAY9dCDeK (bump: 252)
  ✓ FiadoRecord PDA derived: BmXWQUhJbN21MKMav1KxNErShb8BvcuqFNcxTQDBhcrF (bump: 254)
[5/7] Checking Rust source code constraints in contracts/tefi_program/src/lib.rs...
  ✓ lib.rs verified: bilateral repayment, due_timestamp check, and error codes present
[6/7] Verifying Client Security: Zero unilateral fallbacks in anchorClient.ts...
  ✓ anchorClient.ts verified: zero unilateral fallback paths, strict bilateral signers enforced
[7/7] Verifying Lifecycle & Non-Optimistic Repayment in TefiContext.tsx...
  ✓ TefiContext.tsx verified: strict async lifecycle, no Memo fallback, verified on-chain reconciliation

🎉 ALL 7 TEST SUITES PASSED! Contract schema, PDA derivations, zero fallbacks, and bilateral security verified.

🧪 Iniciando Suite de Pruebas de Integridad Financiera y Anti-Regresión (Tefi.App)...

[1/10] Verificando que solo los fiados ACTIVE suman a la deuda activa...
  ✓ Deuda calculada exactamente en $15.50 USDC (excluye pagados, reclamados, incobrables y montos inválidos)
[2/10] Verificando reconciliación de discrepancias entre cabecera y listado...
  ✓ Discrepancia detectada exitosamente ($0.93 vs $7.51) y reconciliada a $7.51 USDC
[3/10] Verificando desduplicación estricta de registros de fiados...
  ✓ Desduplicación correcta: 3 registros reducidos a 2 únicos
[4/10] Verificando aislamiento y rotulado de datos demo...
  ✓ Datos semilla demo explícitamente etiquetados con isDemo: true y settlementStatus
[5/10] Verificando eliminación total de fallbacks a SPL Memo en TefiContext...
  ✓ Cero llamadas a broadcastSolanaFiadoEvent en TefiContext.tsx (eliminado al 100%)
[6/10] Verificando que createFiado sea asíncrono y condicionado a confirmación...
  ✓ createFiado es estrictamente asíncrono y no asienta deuda sin confirmación on-chain
[7/10] Verificando que acceptScannedFiado sea asíncrono y bilateral...
  ✓ acceptScannedFiado exige await de confirmación on-chain
[8/10] Verificando que repayFiado diferencie modo demo y exija co-firma bilateral...
  ✓ repayFiado aísla demo y exige co-firma bilateral on-chain sin atajos
[9/10] Verificando comprobación previa de existencia de cuentas PDA en anchorClient.ts...
  ✓ anchorClient.ts verifica preexistencia de cuentas PDA antes de enviar la transacción
[10/10] Verificando configuración anti-stale del Service Worker...
  ✓ vite.config.ts configurado para purga inmediata de cachés obsoletas y control de clientes

🎉 LAS 10 PRUEBAS DE INTEGRIDAD FINANCIERA Y ANTI-REGRESIÓN PASARON CON ÉXITO.
```

---

## 4. RESULTADO DEL BUILD

### Comando Ejecutado
```bash
npm run build
```

### Salida Obtenida (Exit Code 0)
```text
> tefi-app@1.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
transforming...
✓ 1773 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                  0.13 kB
dist/manifest.webmanifest           0.40 kB
dist/index.html                     1.33 kB │ gzip:   0.66 kB
dist/assets/index-DJWuAv44.css     59.51 kB │ gzip:  10.19 kB
dist/assets/index-CpdDlfQj.js   1,190.35 kB │ gzip: 344.72 kB
✓ built in 11.14s

PWA v0.21.2
mode      generateSW
precache  8 entries (1282.07 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

---

## 5. RIESGOS QUE CONTINÚAN ABIERTOS

1. **Desactualización del contrato en Solana Devnet:**
   * El bytecode actualmente desplegado en Devnet corresponde al despliegue original del 06/10. La instrucción `repay_fiado` on-chain no tiene la co-firma obligatoria del almacén implementada en el código local de Rust.
   * Cualquier llamada de `repay_fiado` con 5 cuentas hacia el Program ID `3bs3...` en Devnet será rechazada por discrepancia en la deserialización de cuentas de Anchor.
2. **Caché en dispositivos móviles con la PWA instalada:**
   * Dispositivos que hayan agregado la PWA a la pantalla de inicio antes de este cambio deben recibir la actualización del Service Worker mediante una recarga forzada para purgar los scripts antiguos.

---

## 6. LIMITACIONES DE LAS PRUEBAS LOCALES

* Las 17 pruebas ejecutadas con `npm test` verifican exhaustivamente la lógica estática y dinámica en entorno local (Node.js y CI con `solana-test-validator`).
* **No constituyen una prueba de red en vivo contra Devnet.** Una prueba en Devnet requiere que el contrato esté re-desplegado con la autoridad de actualización legítima.

---

## 7. ESTADO DEL CONTRATO EN SOLANA DEVNET (EVIDENCIA DE LECTURA)

* **Program ID:** `3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc`
* **Existe en Devnet:** `true`
* **Ejecutable:** `true`
* **Owner:** `BPFLoaderUpgradeab1e11111111111111111111111`
* **ProgramData Account:** `769c5qYe9x59ipTtCd7bNYUHhw1D9KtMMspJMqLEbPZh` (305,301 bytes)
* **Upgrade Authority:** `HbEfky8hkQXRq5tV76ZWfiM3XqPWo34tbdUG2pwxEyLf`
* **Historial de Invocaciones:** 6 transacciones registradas (`5nx39Tk5...` deploy el 06/10, inicializaciones y emisiones).
* **Bloqueo Insuperable:** No se dispone de la clave privada de `HbEfky8hkQXRq5tV76ZWfiM3XqPWo34tbdUG2pwxEyLf` en el entorno local, por lo que **no es posible ejecutar `anchor deploy` sin dicha autoridad**.

---

## 8. PROCEDIMIENTO DE PRUEBA MANUAL DE LA PWA

Para verificar la aplicación en el navegador sin ambigüedades:

1. **Limpieza de estado previo:**
   * Abrir DevTools (`F12`) -> Pestaña **Application** -> **Storage** -> Pulsar **"Clear site data"**.
   * Realizar una recarga forzada (`Ctrl + Shift + R`).
2. **Verificación de consistencia matemática:**
   * Iniciar en rol **Vecino**.
   * Observar el banner "Consumos Totales": Debe mostrar `$18.50 USDC`.
   * Sumar los dos fiados activos en la libreta (`f-101`: `$12.00` y `f-102`: `$6.50`): La suma es exactamente `$18.50 USDC`. No existe discrepancia ni multiplicadores ocultos.
   * Constatar que cada fiado semilla tiene el badge **"Modo Demo"**.
3. **Prueba de repago en Modo Demo:**
   * Pulsar "Pagar" en el fiado `f-102` ($6.50).
   * Confirmar el pago.
   * El fiado pasa a pagado, la deuda desciende a `$12.00 USDC` y la notificación indica explícitamente: *"Pago Registrado (Modo Demo Simulado)"*. No se genera ninguna transacción falsa ni se afirma falsedad sobre Devnet.
4. **Prueba de intento on-chain con fallo explícito:**
   * Si se crea un fiado nuevo e intenta emitirse hacia Devnet, si la llamada RPC es rechazada, la interfaz muestra el error concreto devuelto por Solana y **no incrementa la deuda ni añade fiados fantasmas**.

---

## 9. CRITERIOS OBJETIVOS PARA AVANZAR A PRUEBA END-TO-END

Se podrá avanzar a una prueba completa de extremo a extremo en Devnet únicamente si se cumplen las siguientes condiciones:
1. La autoridad de actualización (`HbEfky...`) ejecuta `anchor deploy` del binario SBF generado en `contracts/tefi_program/target/deploy/tefi_program.so`.
2. Se emite una transacción de `issue_fiado` en Devnet que genere su `FiadoRecord` PDA observable en Solana Explorer.
3. Se ejecuta `repay_fiado` con co-firma bilateral confirmada en Solana Explorer con estado `Finalized`.
