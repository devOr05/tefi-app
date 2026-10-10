// Co-firma bilateral entre dos teléfonos.
//
// 1. El teléfono del almacén arma la transacción (issue_fiado o repay_fiado), se pone como fee payer,
//    la firma parcialmente con SU clave y la muestra en un QR / link.
// 2. El teléfono del vecino la lee, verifica qué va a firmar, agrega SU firma y la envía a Solana.
//
// Ninguno de los dos teléfonos necesita la clave del otro. Módulo puro: sin red ni almacenamiento.
import { Buffer } from 'buffer';
import { utils } from '@coral-xyz/anchor';
import { Keypair, Message, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  decodeTefiInstruction,
  getCustomerProfilePda,
  getMerchantProfilePda,
  initializeCustomerIx,
  issueFiadoIx,
  repayFiadoIx
} from './program';

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

const bs58 = utils.bytes.bs58;
// Firma todavía ausente, tal como la escribe Solana en una transacción parcialmente firmada
const EMPTY_SIGNATURE = bs58.encode(Buffer.alloc(64));

const compareBytes = (a: Uint8Array, b: Uint8Array): number => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
};

/**
 * Arma el mensaje de la transacción con un orden de cuentas fijo: primero quien paga, después los demás
 * firmantes y al final el resto, cada grupo ordenado por los bytes de la clave. Los dos teléfonos llegan
 * así al mismo mensaje byte a byte a partir de los mismos datos, que es lo que permite que el QR lleve
 * solo esos datos (formato compacto) en lugar de la transacción entera.
 */
export function compileCosignMessage(feePayer: PublicKey, instructions: TransactionInstruction[], recentBlockhash: string): Message {
  const metas = new Map<string, { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>();
  const touch = (pubkey: PublicKey, isSigner: boolean, isWritable: boolean) => {
    const known = metas.get(pubkey.toBase58());
    if (known) {
      known.isSigner ||= isSigner;
      known.isWritable ||= isWritable;
    } else {
      metas.set(pubkey.toBase58(), { pubkey, isSigner, isWritable });
    }
  };
  touch(feePayer, true, true);
  for (const ix of instructions) {
    ix.keys.forEach(key => touch(key.pubkey, key.isSigner, key.isWritable));
    touch(ix.programId, false, false);
  }

  // Grupos que exige Solana: firmantes con escritura, firmantes de solo lectura, no firmantes con escritura, resto
  const group = (meta: { isSigner: boolean; isWritable: boolean }) => (meta.isSigner ? 0 : 2) + (meta.isWritable ? 0 : 1);
  const ordered = [...metas.values()].sort((a, b) => {
    if (a.pubkey.equals(feePayer)) return -1;
    if (b.pubkey.equals(feePayer)) return 1;
    return group(a) - group(b) || compareBytes(a.pubkey.toBytes(), b.pubkey.toBytes());
  });
  const position = new Map(ordered.map((meta, index) => [meta.pubkey.toBase58(), index]));

  return new Message({
    header: {
      numRequiredSignatures: ordered.filter(meta => meta.isSigner).length,
      numReadonlySignedAccounts: ordered.filter(meta => meta.isSigner && !meta.isWritable).length,
      numReadonlyUnsignedAccounts: ordered.filter(meta => !meta.isSigner && !meta.isWritable).length
    },
    accountKeys: ordered.map(meta => meta.pubkey),
    recentBlockhash,
    instructions: instructions.map(ix => ({
      programIdIndex: position.get(ix.programId.toBase58())!,
      accounts: ix.keys.map(key => position.get(key.pubkey.toBase58())!),
      data: bs58.encode(ix.data)
    }))
  });
}

// Transacción a partir del mensaje y de las firmas que ya se tengan (las que falten quedan vacías)
function transactionFromMessage(message: Message, signatures: Array<Uint8Array | null>): Transaction {
  const slots = Array.from({ length: message.header.numRequiredSignatures }, (_, index) => signatures[index] ?? null);
  return Transaction.populate(
    message,
    slots.map(signature => (signature ? bs58.encode(signature) : EMPTY_SIGNATURE))
  );
}

export function buildStoreSignedTransaction(params: {
  merchant: Keypair;
  instructions: TransactionInstruction[];
  blockhash: string;
  lastValidBlockHeight: number;
}): { tx: Transaction; signature: string } {
  const { merchant, instructions, blockhash, lastValidBlockHeight } = params;
  // El almacén es el fee payer: el vecino firma sin tener SOL
  const tx = transactionFromMessage(compileCosignMessage(merchant.publicKey, instructions, blockhash), []);
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.partialSign(merchant);
  // La firma del fee payer es el id de la transacción: el almacén ya puede seguirla en el explorer
  return { tx, signature: bs58.encode(tx.signature!) };
}

// -------------------------------------------------------------
// FORMATO DEL QR / LINK
// -------------------------------------------------------------

// Formato compacto (?Q=...): el QR no lleva la transacción entera sino los datos para rearmarla. El teléfono
// del vecino la reconstruye con su propia clave y verifica contra ella la firma del almacén, así que
// cualquier dato alterado en el camino invalida el pedido. Un QR con la mitad de datos tiene módulos más
// grandes y la cámara lo lee desde más lejos.
// Formato completo (?cosign=...): la transacción serializada tal cual. Queda como respaldo para pedidos
// que no entran en el compacto y para links generados por versiones anteriores.

export interface CosignEnvelope {
  tx: Transaction;
  storeName: string;
  ticket?: ReceiptTicket;
  /** Número de fiado del almacén: hace falta para rearmar la transacción en el formato compacto. */
  nonce?: number;
}

const COMPACT_VERSION = 1;
const FLAG_REPAY = 1;
const FLAG_PROFILE_SETUP = 2;
const FLAG_PHOTO = 4;
const FLAG_INTEGER_ARS = 8;
const FINGERPRINT_BYTES = 4;

const toBase64Url = (bytes: Buffer): string =>
  bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (text: string): Buffer => Buffer.from(text.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

// Base32 (RFC 4648, sin relleno): solo mayúsculas y dígitos, que un QR guarda en modo alfanumérico
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let text = '';
  for (const byte of bytes) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      text += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) text += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return text;
}

function fromBase32(text: string): Buffer {
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of text.toUpperCase()) {
    const digit = BASE32_ALPHABET.indexOf(char);
    if (digit < 0) throw new CosignError('MALFORMED', 'The QR contains characters that do not belong to a Tefi request.');
    value = ((value << 5) | digit) & 0xfff;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// Escritor y lector del pedido compacto: enteros de largo variable (LEB128) y textos con su largo adelante
class EnvelopeWriter {
  private readonly parts: Buffer[] = [];

  bytes(value: Uint8Array): this {
    this.parts.push(Buffer.from(value));
    return this;
  }

  varint(value: bigint | number): this {
    let rest = BigInt(value);
    if (rest < 0n) throw new RangeError('Los enteros del pedido compacto no pueden ser negativos');
    const out: number[] = [];
    do {
      const low = Number(rest & 0x7fn);
      rest >>= 7n;
      out.push(rest > 0n ? low | 0x80 : low);
    } while (rest > 0n);
    return this.bytes(Uint8Array.from(out));
  }

  float64(value: number): this {
    const out = Buffer.alloc(8);
    out.writeDoubleLE(value);
    return this.bytes(out);
  }

  text(value: string): this {
    const encoded = Buffer.from(value, 'utf8');
    return this.varint(encoded.length).bytes(encoded);
  }

  finish(): Buffer {
    return Buffer.concat(this.parts);
  }
}

class EnvelopeReader {
  private offset = 0;

  constructor(private readonly data: Buffer) {}

  bytes(length: number): Buffer {
    if (this.offset + length > this.data.length) throw new CosignError('MALFORMED', 'The QR is incomplete.');
    const out = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return out;
  }

  varint(): bigint {
    let value = 0n;
    for (let shift = 0n; shift < 70n; shift += 7n) {
      const byte = this.bytes(1)[0];
      value |= BigInt(byte & 0x7f) << shift;
      if (!(byte & 0x80)) return value;
    }
    throw new CosignError('MALFORMED', 'The QR contains a number that is too long.');
  }

  float64(): number {
    return this.bytes(8).readDoubleLE(0);
  }

  text(): string {
    return this.bytes(Number(this.varint())).toString('utf8');
  }

  get isAtEnd(): boolean {
    return this.offset === this.data.length;
  }
}

const isSha256Hex = (text: string): boolean => /^[0-9a-f]{64}$/.test(text);

// Lee un pedido compacto y rearma la transacción con la clave del vecino que lo abrió
function decodeCompact(payload: Buffer, customer: PublicKey): CosignEnvelope {
  const reader = new EnvelopeReader(payload);
  if (reader.bytes(1)[0] !== COMPACT_VERSION) {
    throw new CosignError('MALFORMED', 'This QR was made by a different version of Tefi.');
  }
  const flags = reader.bytes(1)[0];
  const merchant = new PublicKey(reader.bytes(32));
  const fingerprint = reader.bytes(FINGERPRINT_BYTES);
  const storeSignature = reader.bytes(64);
  const blockhash = bs58.encode(reader.bytes(32));
  const nonce = reader.varint();

  let instructions: TransactionInstruction[];
  let ticket: ReceiptTicket | undefined;
  if (flags & FLAG_REPAY) {
    instructions = [repayFiadoIx({ merchant, customer, nonce })];
  } else {
    const amountMicroUsdc = reader.varint();
    const dueTimestamp = Number(reader.varint());
    const receiptHash = reader.bytes(32).toString('hex');
    const amountArs = flags & FLAG_INTEGER_ARS ? Number(reader.varint()) : reader.float64();
    const photoSha256 = flags & FLAG_PHOTO ? reader.bytes(32).toString('hex') : '';
    ticket = { amountArs, items: reader.text(), photoSha256 };
    const issue = issueFiadoIx({ merchant, customer, nonce, amountMicroUsdc, dueTimestamp, receiptHash });
    instructions = flags & FLAG_PROFILE_SETUP ? [initializeCustomerIx(merchant, customer), issue] : [issue];
  }
  const storeName = reader.text();
  if (!reader.isAtEnd) throw new CosignError('MALFORMED', 'The QR has more data than a Tefi request.');

  // La huella dice para qué vecino se emitió: con otra clave la transacción rearmada no sería la que firmó el almacén
  if (!Buffer.from(customer.toBytes().subarray(0, FINGERPRINT_BYTES)).equals(fingerprint)) {
    throw new CosignError('NOT_FOR_THIS_NEIGHBOR', 'This request was issued for a different neighbor.');
  }

  const tx = transactionFromMessage(compileCosignMessage(merchant, instructions, blockhash), [storeSignature]);
  return { tx, storeName, ticket, nonce: Number(nonce) };
}

// Devuelve null si el pedido no se puede llevar en el formato compacto (va entonces en el formato completo)
function encodeCompact(envelope: CosignEnvelope): string | null {
  const { tx, storeName, ticket, nonce } = envelope;
  if (nonce === undefined) return null;

  try {
    const message = tx.compileMessage();
    if (message.header.numRequiredSignatures !== 2) return null;
    const merchant = message.accountKeys[0];
    const customer = message.accountKeys[1];
    const storeSignature = tx.signatures.find(pair => pair.publicKey.equals(merchant))?.signature;
    if (!storeSignature) return null;

    const steps = tx.instructions.map(ix => decodeTefiInstruction(ix));
    const shape = steps.map(step => step?.name).join('+');
    const issue = steps[steps.length - 1];

    let flags = 0;
    const body = new EnvelopeWriter();
    if (shape === 'repayFiado') {
      flags |= FLAG_REPAY;
    } else if ((shape === 'issueFiado' || shape === 'initializeCustomer+issueFiado') && issue?.name === 'issueFiado') {
      if (!ticket || !isSha256Hex(issue.receiptHash) || (ticket.photoSha256 && !isSha256Hex(ticket.photoSha256))) return null;
      if (steps.length === 2) flags |= FLAG_PROFILE_SETUP;
      body.varint(issue.amountMicroUsdc).varint(issue.dueTimestamp).bytes(Buffer.from(issue.receiptHash, 'hex'));
      if (Number.isSafeInteger(ticket.amountArs) && ticket.amountArs >= 0) {
        flags |= FLAG_INTEGER_ARS;
        body.varint(ticket.amountArs);
      } else {
        body.float64(ticket.amountArs);
      }
      if (ticket.photoSha256) {
        flags |= FLAG_PHOTO;
        body.bytes(Buffer.from(ticket.photoSha256, 'hex'));
      }
      body.text(ticket.items);
    } else {
      return null;
    }

    const payload = new EnvelopeWriter()
      .bytes(Uint8Array.of(COMPACT_VERSION, flags))
      .bytes(merchant.toBytes())
      .bytes(customer.toBytes().subarray(0, FINGERPRINT_BYTES))
      .bytes(storeSignature)
      .bytes(bs58.decode(message.recentBlockhash))
      .varint(nonce)
      .bytes(body.finish())
      .text(storeName)
      .finish();

    // Solo se usa si al rearmarlo queda exactamente la misma transacción y el mismo ticket
    const rebuilt = decodeCompact(payload, customer);
    const sameTransaction = rebuilt.tx.serializeMessage().equals(tx.serializeMessage());
    const sameTicket = JSON.stringify(rebuilt.ticket) === JSON.stringify(ticket) && rebuilt.storeName === storeName;
    return sameTransaction && sameTicket ? toBase32(payload) : null;
  } catch (e) {
    return null;
  }
}

function extractParams(text: string): URLSearchParams | null {
  const trimmed = text.trim();
  try {
    return new URL(trimmed).searchParams;
  } catch (e) {
    return trimmed.includes('=') ? new URLSearchParams(trimmed.replace(/^[^?]*\?/, '')) : null;
  }
}

// Parámetro del formato compacto. La cámara puede entregar la URL en mayúsculas o en minúsculas.
const compactParam = (params: URLSearchParams): string | null => params.get('Q') ?? params.get('q');

/** Dice si un link (o la dirección con la que se abrió la app) trae un pedido de co-firma. */
export function hasCosignRequest(params: URLSearchParams): boolean {
  return params.has('cosign') || !!compactParam(params);
}

export function encodeCosignUrl(baseUrl: string, envelope: CosignEnvelope): string {
  const origin = baseUrl.replace(/\/$/, '');
  const compact = encodeCompact(envelope);
  if (compact) return `${origin}/?Q=${compact}`;

  const params = new URLSearchParams();
  // La firma del vecino todavía falta: se serializa sin exigir todas las firmas
  params.set('cosign', toBase64Url(envelope.tx.serialize({ requireAllSignatures: false })));
  params.set('s', envelope.storeName);
  if (envelope.ticket) {
    params.set('ars', String(envelope.ticket.amountArs));
    params.set('d', envelope.ticket.items);
    if (envelope.ticket.photoSha256) params.set('ph', envelope.ticket.photoSha256);
  }
  return `${origin}/?${params.toString()}`;
}

/**
 * Texto que va adentro del QR. Un pedido compacto se escribe todo en mayúsculas (esquema y dominio no
 * distinguen mayúsculas) para que el QR lo guarde en modo alfanumérico, que ocupa un tercio menos.
 */
export function cosignQrText(url: string): string {
  return /^https?:\/\/[^/?#]+\/\?Q=[A-Z2-7]+$/.test(url) ? url.toUpperCase() : url;
}

/**
 * Lee un pedido de co-firma. `customer` es la clave pública del vecino que lo abre: el formato compacto la
 * necesita para rearmar la transacción. Devuelve null si el texto no es un pedido de co-firma de Tefi.
 */
export function parseCosignUrl(text: string, customer?: PublicKey): CosignEnvelope | null {
  const params = extractParams(text);
  if (!params) return null;

  const compact = compactParam(params);
  if (compact) {
    if (!customer) throw new CosignError('MALFORMED', 'A neighbor key is needed to read this request.');
    try {
      return decodeCompact(fromBase32(compact), customer);
    } catch (e) {
      if (e instanceof CosignError) throw e;
      throw new CosignError('MALFORMED', 'The QR does not contain a valid Tefi request.');
    }
  }

  const wire = params.get('cosign');
  if (!wire) return null;

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
