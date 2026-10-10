// Co-firma bilateral entre dos teléfonos.
//
// 1. El teléfono del almacén arma la transacción (issue_fiado o repay_fiado), se pone como fee payer,
//    la firma parcialmente con SU clave y la muestra en un QR / link.
// 2. El teléfono del vecino la lee, verifica qué va a firmar, agrega SU firma y la envía a Solana.
//
// Ninguno de los dos teléfonos necesita la clave del otro. Módulo puro: sin red ni almacenamiento.
import { Buffer } from 'buffer';
import { utils } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { decodeTefiInstruction, getCustomerProfilePda, getMerchantProfilePda } from './program';

export type CosignErrorCode =
  | 'MALFORMED'
  | 'UNEXPECTED_SHAPE'
  | 'FOREIGN_INSTRUCTION'
  | 'NOT_FOR_THIS_NEIGHBOR'
  | 'MISSING_STORE_SIGNATURE'
  | 'INVALID_STORE_SIGNATURE'
  | 'TICKET_MISMATCH';

export class CosignError extends Error {
  readonly code: CosignErrorCode;

  constructor(code: CosignErrorCode, message: string) {
    super(message);
    this.name = 'CosignError';
    this.code = code;
  }
}

// -------------------------------------------------------------
// TICKET Y HASH DEL COMPROBANTE
// -------------------------------------------------------------

/** Detalle de la compra. Viaja de teléfono a teléfono en el QR y NUNCA se escribe on-chain. */
export interface ReceiptTicket {
  amountArs: number;
  items: string;
  photoSha256: string; // SHA-256 de la foto del ticket ('' si no hay foto)
}

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash que se guarda en `receipt_hash`: compromete el ticket completo sin revelar su contenido.
 * Cualquiera que tenga el ticket puede recalcularlo y probar que corresponde a ese fiado.
 */
export async function computeReceiptHash(params: {
  merchant: PublicKey;
  customer: PublicKey;
  amountMicroUsdc: bigint;
  dueTimestamp: number;
  ticket: ReceiptTicket;
}): Promise<string> {
  const { merchant, customer, amountMicroUsdc, dueTimestamp, ticket } = params;
  return sha256Hex(
    JSON.stringify([
      'tefi-receipt-v1',
      merchant.toBase58(),
      customer.toBase58(),
      amountMicroUsdc.toString(),
      String(dueTimestamp),
      String(ticket.amountArs),
      ticket.photoSha256,
      ticket.items
    ])
  );
}

// -------------------------------------------------------------
// TELÉFONO DEL ALMACÉN: ARMAR Y FIRMAR PARCIALMENTE
// -------------------------------------------------------------

export function buildStoreSignedTransaction(params: {
  merchant: Keypair;
  instructions: TransactionInstruction[];
  blockhash: string;
  lastValidBlockHeight: number;
}): { tx: Transaction; signature: string } {
  const { merchant, instructions, blockhash, lastValidBlockHeight } = params;
  // El almacén es el fee payer: el vecino firma sin tener SOL
  const tx = new Transaction({ feePayer: merchant.publicKey, blockhash, lastValidBlockHeight });
  tx.add(...instructions);
  tx.partialSign(merchant);
  // La firma del fee payer es el id de la transacción: el almacén ya puede seguirla en el explorer
  return { tx, signature: utils.bytes.bs58.encode(tx.signature!) };
}

// -------------------------------------------------------------
// FORMATO DEL QR / LINK
// -------------------------------------------------------------

export interface CosignEnvelope {
  tx: Transaction;
  storeName: string;
  ticket?: ReceiptTicket;
}

const toBase64Url = (bytes: Buffer): string =>
  bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (text: string): Buffer => Buffer.from(text.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function extractParams(text: string): URLSearchParams | null {
  const trimmed = text.trim();
  try {
    return new URL(trimmed).searchParams;
  } catch (e) {
    return trimmed.includes('=') ? new URLSearchParams(trimmed.replace(/^[^?]*\?/, '')) : null;
  }
}

export function encodeCosignUrl(baseUrl: string, envelope: CosignEnvelope): string {
  const params = new URLSearchParams();
  // La firma del vecino todavía falta: se serializa sin exigir todas las firmas
  params.set('cosign', toBase64Url(envelope.tx.serialize({ requireAllSignatures: false })));
  params.set('s', envelope.storeName);
  if (envelope.ticket) {
    params.set('ars', String(envelope.ticket.amountArs));
    params.set('d', envelope.ticket.items);
    if (envelope.ticket.photoSha256) params.set('ph', envelope.ticket.photoSha256);
  }
  return `${baseUrl.replace(/\/$/, '')}/?${params.toString()}`;
}

/** Devuelve null si el texto no es un pedido de co-firma de Tefi. */
export function parseCosignUrl(text: string): CosignEnvelope | null {
  const params = extractParams(text);
  const wire = params?.get('cosign');
  if (!params || !wire) return null;

  let tx: Transaction;
  try {
    tx = Transaction.from(fromBase64Url(wire));
  } catch (e) {
    throw new CosignError('MALFORMED', 'The QR does not contain a valid Solana transaction.');
  }

  const ars = params.get('ars');
  return {
    tx,
    storeName: params.get('s') || '',
    ticket:
      ars !== null
        ? { amountArs: Number(ars), items: params.get('d') || '', photoSha256: params.get('ph') || '' }
        : undefined
  };
}

/** Identidad pública del vecino: es lo único que el almacén necesita para armarle un fiado. */
export interface NeighborIdentity {
  address: string;
  name: string;
}

function isSolanaAddress(text: string): boolean {
  try {
    return new PublicKey(text).toBase58() === text;
  } catch (e) {
    return false;
  }
}

export function encodeNeighborUrl(baseUrl: string, identity: NeighborIdentity): string {
  const params = new URLSearchParams({ neighbor: identity.address, name: identity.name });
  return `${baseUrl.replace(/\/$/, '')}/?${params.toString()}`;
}

/** Acepta el link del QR del vecino o su clave pública pegada a mano. */
export function parseNeighborUrl(text: string): NeighborIdentity | null {
  const trimmed = text.trim();
  if (isSolanaAddress(trimmed)) return { address: trimmed, name: '' };

  const params = extractParams(trimmed);
  const address = params?.get('neighbor');
  if (!params || !address || !isSolanaAddress(address)) return null;
  return { address, name: params.get('name') || '' };
}

// -------------------------------------------------------------
// TELÉFONO DEL VECINO: VERIFICAR, FIRMAR Y ENVIAR
// -------------------------------------------------------------

interface InspectedBase {
  merchant: PublicKey;
  customer: PublicKey;
  fiadoRecord: PublicKey;
  signature: string; // firma del almacén = id de la transacción en el explorer
}

export interface InspectedIssue extends InspectedBase {
  kind: 'issue';
  amountMicroUsdc: bigint;
  dueTimestamp: number;
  receiptHash: string;
  includesProfileSetup: boolean; // primer fiado del vecino: el almacén también paga el alta de su perfil
}

export interface InspectedRepay extends InspectedBase {
  kind: 'repay';
}

export type InspectedCosign = InspectedIssue | InspectedRepay;

/**
 * Lee la transacción que firmó el almacén y devuelve lo que el vecino está por firmar.
 * Rechaza todo lo que no sea exactamente un fiado o un repago de Tefi para ESTE vecino: el vecino
 * firma lo que dice la transacción, no lo que dice la pantalla del almacén.
 */
export function inspectCosignTransaction(tx: Transaction, expectedCustomer: PublicKey): InspectedCosign {
  let message;
  try {
    message = tx.compileMessage();
  } catch (e) {
    throw new CosignError('MALFORMED', 'The transaction could not be read.');
  }

  // Exactamente dos firmantes: el almacén (fee payer) y el vecino
  if (message.header.numRequiredSignatures !== 2) {
    throw new CosignError('UNEXPECTED_SHAPE', 'A Tefi co-signature needs exactly two signers: store and neighbor.');
  }
  const merchant = message.accountKeys[0];
  const customer = message.accountKeys[1];
  if (!customer.equals(expectedCustomer)) {
    throw new CosignError('NOT_FOR_THIS_NEIGHBOR', 'This request was issued for a different neighbor.');
  }

  const storeSignature = tx.signatures.find(s => s.publicKey.equals(merchant))?.signature;
  if (!storeSignature) {
    throw new CosignError('MISSING_STORE_SIGNATURE', 'The store has not signed this request.');
  }
  if (!tx.verifySignatures(false)) {
    throw new CosignError('INVALID_STORE_SIGNATURE', 'The store signature does not match this request.');
  }

  const steps = tx.instructions.map(ix => {
    let decoded;
    try {
      decoded = decodeTefiInstruction(ix);
    } catch (e) {
      decoded = null;
    }
    if (!decoded) {
      throw new CosignError('FOREIGN_INSTRUCTION', 'The request contains an instruction that is not a Tefi fiado.');
    }
    return { ix, decoded };
  });

  const expectAccount = (ix: TransactionInstruction, index: number, expected: PublicKey) => {
    if (!ix.keys[index]?.pubkey.equals(expected)) {
      throw new CosignError('UNEXPECTED_SHAPE', 'The request references unexpected accounts.');
    }
  };
  const customerProfile = getCustomerProfilePda(customer);
  const base = { merchant, customer, signature: utils.bytes.bs58.encode(storeSignature) };
  const shape = steps.map(step => step.decoded.name).join('+');

  if (shape === 'issueFiado' || shape === 'initializeCustomer+issueFiado') {
    const includesProfileSetup = steps.length === 2;
    if (includesProfileSetup) {
      const setup = steps[0].ix;
      expectAccount(setup, 0, merchant);
      expectAccount(setup, 1, customer);
      expectAccount(setup, 2, customerProfile);
      expectAccount(setup, 3, SystemProgram.programId);
    }

    const { ix, decoded } = steps[steps.length - 1];
    if (decoded.name !== 'issueFiado') throw new CosignError('UNEXPECTED_SHAPE', 'Unexpected request.');
    expectAccount(ix, 0, merchant);
    expectAccount(ix, 1, customer);
    expectAccount(ix, 2, getMerchantProfilePda(merchant));
    expectAccount(ix, 3, customerProfile);
    expectAccount(ix, 5, SystemProgram.programId);

    return {
      ...base,
      kind: 'issue',
      fiadoRecord: ix.keys[4].pubkey,
      amountMicroUsdc: decoded.amountMicroUsdc,
      dueTimestamp: decoded.dueTimestamp,
      receiptHash: decoded.receiptHash,
      includesProfileSetup
    };
  }

  if (shape === 'repayFiado') {
    const { ix } = steps[0];
    expectAccount(ix, 0, merchant);
    expectAccount(ix, 1, customer);
    expectAccount(ix, 2, customerProfile);
    expectAccount(ix, 4, SystemProgram.programId);
    return { ...base, kind: 'repay', fiadoRecord: ix.keys[3].pubkey };
  }

  throw new CosignError('UNEXPECTED_SHAPE', 'The request is not a Tefi fiado or repayment.');
}

/** El ticket que ve el vecino tiene que ser el mismo que el almacén comprometió en `receipt_hash`. */
export async function assertTicketMatches(inspected: InspectedIssue, ticket: ReceiptTicket | undefined): Promise<void> {
  const expected = ticket
    ? await computeReceiptHash({
        merchant: inspected.merchant,
        customer: inspected.customer,
        amountMicroUsdc: inspected.amountMicroUsdc,
        dueTimestamp: inspected.dueTimestamp,
        ticket
      })
    : null;
  if (expected !== inspected.receiptHash) {
    throw new CosignError('TICKET_MISMATCH', 'The receipt shown does not match the one the store signed.');
  }
}

/** Agrega la firma del vecino y devuelve la transacción lista para enviar (exige y verifica ambas firmas). */
export function completeCosign(tx: Transaction, customer: Keypair): Buffer {
  tx.partialSign(customer);
  return tx.serialize();
}
