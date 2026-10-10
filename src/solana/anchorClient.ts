// Cliente del programa Anchor de Tefi sobre Solana Devnet: lecturas de estado y armado/envío de transacciones.
import { Buffer } from 'buffer';
import { utils } from '@coral-xyz/anchor';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { solanaConnection } from './connection';
import { buildStoreSignedTransaction } from './cosign';
import {
  FIADO_CUSTOMER_OFFSET,
  FIADO_MERCHANT_OFFSET,
  OnChainCustomerProfile,
  OnChainFiado,
  OnChainMerchantProfile,
  TEFI_PROGRAM_ID,
  decodeCustomerProfile,
  decodeFiadoRecord,
  decodeMerchantProfile,
  fiadoRecordDiscriminator,
  getCustomerProfilePda,
  getMerchantProfilePda,
  initializeCustomerIx,
  initializeMerchantIx,
  issueFiadoIx,
  programErrorMessage,
  repayFiadoIx
} from './program';

// -------------------------------------------------------------
// CONSULTAS ON-CHAIN (READ STATE)
// -------------------------------------------------------------
// Devuelven null si la cuenta todavía no existe; los errores de red se propagan al que llama.

export async function fetchOnChainCustomerProfile(customer: PublicKey): Promise<OnChainCustomerProfile | null> {
  const info = await solanaConnection.getAccountInfo(getCustomerProfilePda(customer));
  return info ? decodeCustomerProfile(info.data) : null;
}

export async function fetchOnChainMerchantProfile(merchant: PublicKey): Promise<OnChainMerchantProfile | null> {
  const info = await solanaConnection.getAccountInfo(getMerchantProfilePda(merchant));
  return info ? decodeMerchantProfile(info.data) : null;
}

export async function fetchOnChainFiado(fiadoRecord: PublicKey): Promise<OnChainFiado | null> {
  const info = await solanaConnection.getAccountInfo(fiadoRecord);
  return info ? decodeFiadoRecord(fiadoRecord, info.data) : null;
}

/** Todos los fiados de un almacén o de un vecino, leídos directo de las cuentas del programa. */
export async function fetchOnChainFiados(party: { merchant: PublicKey } | { customer: PublicKey }): Promise<OnChainFiado[]> {
  const partyFilter =
    'merchant' in party
      ? { memcmp: { offset: FIADO_MERCHANT_OFFSET, bytes: party.merchant.toBase58() } }
      : { memcmp: { offset: FIADO_CUSTOMER_OFFSET, bytes: party.customer.toBase58() } };

  const accounts = await solanaConnection.getProgramAccounts(TEFI_PROGRAM_ID, {
    commitment: 'confirmed',
    filters: [{ memcmp: { offset: 0, bytes: utils.bytes.bs58.encode(fiadoRecordDiscriminator()) } }, partyFilter]
  });
  return accounts.map(({ pubkey, account }) => decodeFiadoRecord(pubkey, account.data));
}

// -------------------------------------------------------------
// ENVÍO Y CONFIRMACIÓN
// -------------------------------------------------------------

const CONFIRMATION_TIMEOUT_MS = 60_000;
const CONFIRMATION_POLL_MS = 1_500;
// Devnet tarda alrededor de un segundo en confirmar: consultar antes gasta un pedido del cupo del nodo
const FIRST_CONFIRMATION_CHECK_MS = 1_000;

/** Estado de una o varias transacciones: devuelve la que ya entró a la cadena, si alguna entró. */
export async function findLandedSignature(signatures: string[]): Promise<{ signature: string; failed: boolean } | null> {
  if (signatures.length === 0) return null;
  const { value } = await solanaConnection.getSignatureStatuses(signatures);
  for (let i = 0; i < value.length; i++) {
    const status = value[i];
    if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
      return { signature: signatures[i], failed: !!status.err };
    }
  }
  return null;
}

// Envía una transacción ya firmada y espera su confirmación consultando su estado (sin WebSocket)
async function sendAndConfirm(rawTransaction: Buffer): Promise<string> {
  const signature = await solanaConnection.sendRawTransaction(rawTransaction, { preflightCommitment: 'confirmed' });

  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;
  let wait = FIRST_CONFIRMATION_CHECK_MS;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, wait));
    wait = CONFIRMATION_POLL_MS;
    const landed = await findLandedSignature([signature]).catch(() => null);
    if (landed) {
      if (landed.failed) throw new TefiChainError('REJECTED', `Transaction ${signature} was rejected by the program`);
      return signature;
    }
  }
  throw new TefiChainError('EXPIRED', `Transaction ${signature} was not confirmed before its blockhash expired`);
}

// -------------------------------------------------------------
// TELÉFONO DEL ALMACÉN (WRITE STATE)
// -------------------------------------------------------------

const truncateUtf8 = (text: string, maxBytes: number): string => {
  let result = text;
  while (new TextEncoder().encode(result).length > maxBytes) result = result.slice(0, -1);
  return result;
};

/** Crea el MerchantProfile del almacén la primera vez (firma y paga solo el almacén). */
export async function ensureMerchantInitialized(merchant: Keypair, businessName: string, category: string): Promise<void> {
  const existing = await solanaConnection.getAccountInfo(getMerchantProfilePda(merchant.publicKey));
  if (existing) return;

  const latest = await solanaConnection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer: merchant.publicKey, ...latest }).add(
    initializeMerchantIx(merchant.publicKey, truncateUtf8(businessName, 50), truncateUtf8(category, 30))
  );
  tx.sign(merchant);
  await sendAndConfirm(tx.serialize());
}

export interface StoreSignedRequest {
  tx: Transaction;
  signature: string;
  fiadoRecord: PublicKey;
  nonce: number;
  includesProfileSetup: boolean;
}

/**
 * Arma issue_fiado con el almacén como fee payer y lo firma parcialmente con la clave del almacén.
 * Si el vecino todavía no tiene perfil on-chain, la misma transacción lo da de alta (rent a cargo del almacén).
 */
export async function buildIssueFiadoRequest(params: {
  merchant: Keypair;
  customer: PublicKey;
  amountMicroUsdc: bigint;
  dueTimestamp: number;
  receiptHash: string;
}): Promise<StoreSignedRequest> {
  const { merchant, customer, amountMicroUsdc, dueTimestamp, receiptHash } = params;

  const [merchantProfile, customerInfo, latest] = await Promise.all([
    fetchOnChainMerchantProfile(merchant.publicKey),
    solanaConnection.getAccountInfo(getCustomerProfilePda(customer)),
    solanaConnection.getLatestBlockhash('confirmed')
  ]);
  // El alta del almacén se confirma antes de llegar acá: si todavía no se ve, el nodo consultado está atrasado
  if (!merchantProfile) throw new TefiChainError('NETWORK', 'Store profile is not visible on-chain yet');

  const nonce = merchantProfile.fiadoNonce;
  const issue = issueFiadoIx({ merchant: merchant.publicKey, customer, nonce, amountMicroUsdc, dueTimestamp, receiptHash });
  const includesProfileSetup = !customerInfo;
  const instructions = includesProfileSetup ? [initializeCustomerIx(merchant.publicKey, customer), issue] : [issue];

  const { tx, signature } = buildStoreSignedTransaction({ merchant, instructions, ...latest });
  return { tx, signature, fiadoRecord: issue.keys[4].pubkey, nonce, includesProfileSetup };
}

/** Arma repay_fiado: el almacén confirma que cobró y paga la comisión; falta la firma del vecino. */
export async function buildRepayFiadoRequest(params: {
  merchant: Keypair;
  customer: PublicKey;
  nonce: number;
}): Promise<StoreSignedRequest> {
  const { merchant, customer, nonce } = params;
  const latest = await solanaConnection.getLatestBlockhash('confirmed');
  const repay = repayFiadoIx({ merchant: merchant.publicKey, customer, nonce });
  const { tx, signature } = buildStoreSignedTransaction({ merchant, instructions: [repay], ...latest });
  return { tx, signature, fiadoRecord: repay.keys[3].pubkey, nonce, includesProfileSetup: false };
}

// -------------------------------------------------------------
// TELÉFONO DEL VECINO (WRITE STATE)
// -------------------------------------------------------------

/** Envía la transacción con las dos firmas y espera su confirmación on-chain. */
export async function submitCosignedTransaction(rawTransaction: Buffer): Promise<string> {
  return sendAndConfirm(rawTransaction);
}

// -------------------------------------------------------------
// ERRORES
// -------------------------------------------------------------

export type ChainErrorCode =
  | 'EXPIRED'
  | 'STALE'
  | 'ALREADY_SENT'
  | 'INSUFFICIENT_SOL'
  | 'PROGRAM'
  | 'REJECTED'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'UNKNOWN';

export interface ChainError {
  code: ChainErrorCode;
  detail: string;
  programCode?: number; // código de error del programa Tefi (6000+) cuando code === 'PROGRAM'
}

/** Error detectado por este cliente, ya clasificado. El texto para el usuario lo arma la interfaz según el idioma. */
export class TefiChainError extends Error {
  readonly code: ChainErrorCode;

  constructor(code: ChainErrorCode, message: string) {
    super(message);
    this.name = 'TefiChainError';
    this.code = code;
  }
}

/** Traduce un error de RPC / simulación a una causa que la interfaz pueda explicar. */
export function classifyChainError(err: unknown): ChainError {
  if (err instanceof TefiChainError) return { code: err.code, detail: err.message };
  const detail = err instanceof Error ? err.message : String(err);

  // La misma transacción (mismas firmas) ya entró a la cadena: el QR se usó dos veces
  if (/already been processed/i.test(detail)) return { code: 'ALREADY_SENT', detail };
  if (/Blockhash not found|block height exceeded|BlockhashNotFound/i.test(detail)) return { code: 'EXPIRED', detail };
  if (/insufficient (lamports|funds)|no record of a prior credit/i.test(detail)) return { code: 'INSUFFICIENT_SOL', detail };

  const custom = detail.match(/custom program error: (0x[0-9a-f]+)/i);
  if (custom) {
    const code = parseInt(custom[1], 16);
    const message = programErrorMessage(code);
    if (message) return { code: 'PROGRAM', detail: message, programCode: code };
    // 0x0 (cuenta ya creada) o restricciones de Anchor: el pedido quedó viejo respecto del estado on-chain
    return { code: 'STALE', detail };
  }

  if (/already in use/i.test(detail)) return { code: 'STALE', detail };
  // web3.js arma el error de un rechazo HTTP como "<status> <statusText>: <cuerpo>"
  if (/^429\b|too many requests|rate limits? exceeded/i.test(detail)) return { code: 'RATE_LIMITED', detail };
  // "Load failed" es el texto de Safari cuando no hay conexión
  if (/failed to fetch|networkerror|load failed|timed? ?out/i.test(detail)) return { code: 'NETWORK', detail };
  return { code: 'UNKNOWN', detail };
}
