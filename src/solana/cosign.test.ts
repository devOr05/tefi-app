import { describe, expect, it } from 'vitest';
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@coral-xyz/anchor';
import QRCode from 'qrcode';
import {
  CosignError,
  ReceiptTicket,
  assertTicketMatches,
  buildStoreSignedTransaction,
  compileCosignMessage,
  completeCosign,
  computeReceiptHash,
  cosignQrText,
  encodeCosignUrl,
  encodeNeighborUrl,
  inspectCosignTransaction,
  parseCosignUrl,
  parseNeighborUrl
} from './cosign';
import { getFiadoRecordPda, initializeCustomerIx, issueFiadoIx, repayFiadoIx } from './program';

const BASE_URL = 'https://tef-iapp.vercel.app';
const BLOCKHASH = Keypair.generate().publicKey.toBase58();
const DUE = 1_800_000_000;
const AMOUNT = 930_000n; // 0.93 USDC

const ticket: ReceiptTicket = {
  amountArs: 1500,
  items: 'Yerba 500g + 1 Pan',
  photoSha256: 'ab'.repeat(32)
};

// El "teléfono del almacén" solo conoce su clave y la clave PÚBLICA del vecino
async function storePhoneIssues(merchant: Keypair, customer: PublicKey, options: { firstFiado?: boolean } = {}) {
  const receiptHash = await computeReceiptHash({ merchant: merchant.publicKey, customer, amountMicroUsdc: AMOUNT, dueTimestamp: DUE, ticket });
  const issue = issueFiadoIx({ merchant: merchant.publicKey, customer, nonce: 7, amountMicroUsdc: AMOUNT, dueTimestamp: DUE, receiptHash });
  const instructions = options.firstFiado ? [initializeCustomerIx(merchant.publicKey, customer), issue] : [issue];
  const { tx, signature } = buildStoreSignedTransaction({ merchant, instructions, blockhash: BLOCKHASH, lastValidBlockHeight: 100 });
  return { url: encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén Don Tito', ticket, nonce: 7 }), tx, signature, receiptHash };
}

// Lo que hace el teléfono del vecino con el texto de un QR, de punta a punta
async function neighborPhoneReads(text: string, customer: PublicKey) {
  const envelope = parseCosignUrl(text, customer)!;
  const inspected = inspectCosignTransaction(envelope.tx, customer);
  if (inspected.kind === 'issue') await assertTicketMatches(inspected, envelope.ticket);
  return { envelope, inspected };
}

// Lectura y escritura del pedido compacto para poder alterarlo en los tests
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function compactPayloadOf(url: string): Uint8Array {
  const text = new URL(url).searchParams.get('Q')!;
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of text) {
    value = ((value << 5) | BASE32.indexOf(char)) & 0xfff;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(bytes);
}
function urlWithCompactPayload(payload: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let text = '';
  for (const byte of payload) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      text += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) text += BASE32[(value << (5 - bits)) & 31];
  return `${BASE_URL}/?Q=${text}`;
}

const expectCosignError = async (run: () => unknown, code: CosignError['code']) => {
  let caught: unknown;
  try {
    await run();
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(CosignError);
  expect((caught as CosignError).code).toBe(code);
};

describe('co-firma entre dos teléfonos', () => {
  it('el almacén firma parcialmente, el vecino completa: la transacción queda con las dos firmas y el almacén como fee payer', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { url, signature } = await storePhoneIssues(merchant, customer.publicKey, { firstFiado: true });

    // Lo único que cruza de un teléfono al otro es el texto del QR
    expect(url).toContain('/?Q=');
    const envelope = parseCosignUrl(url, customer.publicKey)!;
    const inspected = inspectCosignTransaction(envelope.tx, customer.publicKey);
    expect(inspected.kind).toBe('issue');
    expect(inspected.signature).toBe(signature);

    const signed = Transaction.from(completeCosign(envelope.tx, customer));
    expect(signed.signatures).toHaveLength(2);
    expect(signed.signatures.every(s => s.signature !== null)).toBe(true);
    expect(signed.verifySignatures()).toBe(true);
    expect(signed.feePayer!.equals(merchant.publicKey)).toBe(true);
  });

  it('el vecino ve lo que dice la transacción firmada: monto, vencimiento, hash del ticket y cuenta del fiado', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { url, receiptHash } = await storePhoneIssues(merchant, customer.publicKey);

    const envelope = parseCosignUrl(url, customer.publicKey)!;
    const inspected = inspectCosignTransaction(envelope.tx, customer.publicKey);
    if (inspected.kind !== 'issue') throw new Error('se esperaba un fiado');

    expect(inspected.merchant.equals(merchant.publicKey)).toBe(true);
    expect(inspected.amountMicroUsdc).toBe(AMOUNT);
    expect(inspected.dueTimestamp).toBe(DUE);
    expect(inspected.receiptHash).toBe(receiptHash);
    expect(inspected.includesProfileSetup).toBe(false);
    expect(inspected.fiadoRecord.equals(getFiadoRecordPda(merchant.publicKey, customer.publicKey, 7))).toBe(true);
    expect(envelope.storeName).toBe('Almacén Don Tito');
    expect(envelope.ticket).toEqual(ticket);
    await assertTicketMatches(inspected, envelope.ticket);
  });

  it('en el primer fiado el almacén también paga el alta del perfil del vecino', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { url } = await storePhoneIssues(merchant, customer.publicKey, { firstFiado: true });

    const inspected = inspectCosignTransaction(parseCosignUrl(url, customer.publicKey)!.tx, customer.publicKey);
    expect(inspected.kind === 'issue' && inspected.includesProfileSetup).toBe(true);
  });

  it('sin la firma del vecino la transacción no se puede enviar', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { url } = await storePhoneIssues(merchant, customer.publicKey);

    expect(() => parseCosignUrl(url, customer.publicKey)!.tx.serialize()).toThrow(/Signature verification failed|Missing signature/);
  });

  it('rechaza un pedido emitido para otro vecino', async () => {
    const merchant = Keypair.generate();
    const { url, tx } = await storePhoneIssues(merchant, Keypair.generate().publicKey);
    const stranger = Keypair.generate().publicKey;

    // Ni el pedido compacto ni la transacción completa sirven en el teléfono de otro vecino
    await expectCosignError(() => neighborPhoneReads(url, stranger), 'NOT_FOR_THIS_NEIGHBOR');
    await expectCosignError(() => inspectCosignTransaction(tx, stranger), 'NOT_FOR_THIS_NEIGHBOR');
  });

  it('rechaza un QR que esconde una transferencia de SOL del vecino', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const drain = SystemProgram.transfer({ fromPubkey: customer.publicKey, toPubkey: merchant.publicKey, lamports: 1_000_000 });
    const issue = issueFiadoIx({ merchant: merchant.publicKey, customer: customer.publicKey, nonce: 0, amountMicroUsdc: AMOUNT, dueTimestamp: DUE, receiptHash: 'cd'.repeat(32) });
    const { tx } = buildStoreSignedTransaction({ merchant, instructions: [issue, drain], blockhash: BLOCKHASH, lastValidBlockHeight: 100 });
    const url = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén', ticket, nonce: 0 });

    // Un pedido así no entra en el formato compacto, que solo sabe describir fiados y repagos
    expect(url).toContain('/?cosign=');
    await expectCosignError(() => inspectCosignTransaction(parseCosignUrl(url, customer.publicKey)!.tx, customer.publicKey), 'FOREIGN_INSTRUCTION');
  });

  it('rechaza un pedido que el almacén no firmó', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const tx = new Transaction({ feePayer: merchant.publicKey, blockhash: BLOCKHASH, lastValidBlockHeight: 100 });
    tx.add(repayFiadoIx({ merchant: merchant.publicKey, customer: customer.publicKey, nonce: 0 }));
    const url = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén', nonce: 0 });

    await expectCosignError(() => inspectCosignTransaction(parseCosignUrl(url, customer.publicKey)!.tx, customer.publicKey), 'MISSING_STORE_SIGNATURE');
  });

  it('rechaza un monto alterado después de la firma del almacén', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const build = (amountMicroUsdc: bigint) =>
      buildStoreSignedTransaction({
        merchant,
        instructions: [issueFiadoIx({ merchant: merchant.publicKey, customer: customer.publicKey, nonce: 0, amountMicroUsdc, dueTimestamp: DUE, receiptHash: 'cd'.repeat(32) })],
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 100
      }).tx;

    // Se toma la firma de un fiado de 0.93 USDC y se la pega en uno de 50 USDC
    const forged = new Transaction({ feePayer: merchant.publicKey, blockhash: BLOCKHASH, lastValidBlockHeight: 100 });
    forged.add(...build(50_000_000n).instructions);
    forged.addSignature(merchant.publicKey, build(AMOUNT).signature!);
    const wire = forged.serialize({ requireAllSignatures: false, verifySignatures: false });

    await expectCosignError(() => inspectCosignTransaction(Transaction.from(wire), customer.publicKey), 'INVALID_STORE_SIGNATURE');
  });

  it('rechaza un ticket que no coincide con el hash que firmó el almacén', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { tx } = await storePhoneIssues(merchant, customer.publicKey);

    // La transacción es la que firmó el almacén; lo que se cambia es el monto en pesos que se le muestra al vecino
    const tampered = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén Don Tito', ticket: { ...ticket, amountArs: 500 }, nonce: 7 });
    expect(tampered).toContain('/?Q=');
    const envelope = parseCosignUrl(tampered, customer.publicKey)!;
    expect(envelope.ticket!.amountArs).toBe(500);
    const inspected = inspectCosignTransaction(envelope.tx, customer.publicKey);
    if (inspected.kind !== 'issue') throw new Error('se esperaba un fiado');

    await expectCosignError(() => assertTicketMatches(inspected, envelope.ticket), 'TICKET_MISMATCH');
    await expectCosignError(() => assertTicketMatches(inspected, undefined), 'TICKET_MISMATCH');
  });

  it('el repago también es bilateral y viaja por el mismo QR', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { tx, signature } = buildStoreSignedTransaction({
      merchant,
      instructions: [repayFiadoIx({ merchant: merchant.publicKey, customer: customer.publicKey, nonce: 3 })],
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 100
    });
    const url = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén Don Tito', nonce: 3 });
    expect(url).toContain('/?Q=');
    const envelope = parseCosignUrl(url, customer.publicKey)!;

    const inspected = inspectCosignTransaction(envelope.tx, customer.publicKey);
    expect(inspected.kind).toBe('repay');
    expect(inspected.signature).toBe(signature);
    expect(inspected.fiadoRecord.equals(getFiadoRecordPda(merchant.publicKey, customer.publicKey, 3))).toBe(true);
    expect(envelope.ticket).toBeUndefined();
    expect(Transaction.from(completeCosign(envelope.tx, customer)).verifySignatures()).toBe(true);
  });

  it('rechaza instrucciones del programa que el vecino no tiene por qué firmar', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    // Solo el alta de perfil, sin fiado: no es un pedido válido
    const { tx } = buildStoreSignedTransaction({
      merchant,
      instructions: [initializeCustomerIx(merchant.publicKey, customer.publicKey)],
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 100
    });

    await expectCosignError(() => inspectCosignTransaction(tx, customer.publicKey), 'UNEXPECTED_SHAPE');
  });

  it('rechaza cuentas que no corresponden al almacén y al vecino firmantes', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const genuine = repayFiadoIx({ merchant: merchant.publicKey, customer: customer.publicKey, nonce: 0 });
    // Mismo vecino firmante, pero el perfil que se modifica es el de un tercero
    const otherProfile = repayFiadoIx({ merchant: merchant.publicKey, customer: Keypair.generate().publicKey, nonce: 0 }).keys[2];
    const keys = genuine.keys.map((key, index) => (index === 2 ? otherProfile : key));
    const { tx } = buildStoreSignedTransaction({
      merchant,
      instructions: [new TransactionInstruction({ programId: genuine.programId, keys, data: genuine.data })],
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 100
    });

    await expectCosignError(() => inspectCosignTransaction(tx, customer.publicKey), 'UNEXPECTED_SHAPE');
  });
});

describe('formato del QR', () => {
  const versionOf = (text: string) => QRCode.create(text, { errorCorrectionLevel: 'L' }).version;

  it('el pedido compacto rearma exactamente la transacción que firmó el almacén', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    for (const firstFiado of [true, false]) {
      const { url, tx } = await storePhoneIssues(merchant, customer.publicKey, { firstFiado });
      const { envelope } = await neighborPhoneReads(url, customer.publicKey);

      expect(envelope.tx.serialize({ requireAllSignatures: false }).equals(tx.serialize({ requireAllSignatures: false }))).toBe(true);
      expect(envelope.ticket).toEqual(ticket);
      expect(envelope.storeName).toBe('Almacén Don Tito');
    }
  });

  it('el QR de un primer fiado baja de 97 a 61 módulos por lado: la cámara lo lee desde más lejos', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { url, tx } = await storePhoneIssues(merchant, customer.publicKey, { firstFiado: true });
    const fullFormat = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén Don Tito', ticket });

    // Solo mayúsculas, dígitos y los símbolos del modo alfanumérico de un QR (salvo "?" y "=")
    expect(cosignQrText(url)).toMatch(/^HTTPS:\/\/TEF-IAPP\.VERCEL\.APP\/\?Q=[A-Z2-7]+$/);
    expect(versionOf(fullFormat)).toBeGreaterThanOrEqual(20);
    expect(versionOf(cosignQrText(url))).toBeLessThanOrEqual(11);
    // Lo que entrega la cámara (en mayúsculas) se lee igual que el link
    expect((await neighborPhoneReads(cosignQrText(url), customer.publicKey)).inspected.kind).toBe('issue');
    expect((await neighborPhoneReads(url.replace('?Q=', '?q='), customer.publicKey)).inspected.kind).toBe('issue');
  });

  it('el pedido más grande (primer fiado, detalle de 80 caracteres, monto con centavos y foto) sigue siendo un QR mediano', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate().publicKey;
    const longTicket: ReceiptTicket = { amountArs: 123456.78, items: 'Ñ'.repeat(80), photoSha256: 'ab'.repeat(32) };
    const receiptHash = await computeReceiptHash({ merchant: merchant.publicKey, customer, amountMicroUsdc: 50_000_000n, dueTimestamp: DUE, ticket: longTicket });
    const { tx } = buildStoreSignedTransaction({
      merchant,
      instructions: [
        initializeCustomerIx(merchant.publicKey, customer),
        issueFiadoIx({ merchant: merchant.publicKey, customer, nonce: 123456, amountMicroUsdc: 50_000_000n, dueTimestamp: DUE, receiptHash })
      ],
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 100
    });
    const url = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén & Fiambrería Don Tito', ticket: longTicket, nonce: 123456 });

    // Un QR admite hasta la versión 40 (177 módulos por lado); este pedido queda en la 15 (77 módulos)
    expect(versionOf(cosignQrText(url))).toBeLessThanOrEqual(15);
    const { envelope } = await neighborPhoneReads(url, customer);
    expect(envelope.ticket).toEqual(longTicket);
    expect(envelope.storeName).toBe('Almacén & Fiambrería Don Tito');
  });

  it('cualquier bit alterado del pedido compacto lo invalida', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { url } = await storePhoneIssues(merchant, customer.publicKey, { firstFiado: true });
    const payload = compactPayloadOf(url);
    expect((await neighborPhoneReads(urlWithCompactPayload(payload), customer.publicKey)).inspected.kind).toBe('issue');

    // El nombre del almacén va al final y es solo un rótulo: su identidad es la clave que firmó
    const signedLength = payload.length - (1 + new TextEncoder().encode('Almacén Don Tito').length);
    const accepted: number[] = [];
    for (let index = 0; index < signedLength; index++) {
      const altered = Uint8Array.from(payload);
      altered[index] ^= 1 << (index % 8);
      try {
        await neighborPhoneReads(urlWithCompactPayload(altered), customer.publicKey);
        accepted.push(index);
      } catch (err) {
        expect(err).toBeInstanceOf(CosignError);
      }
    }
    expect(accepted).toEqual([]);
  });

  it('un pedido en el formato completo (versiones anteriores) se sigue leyendo', async () => {
    const merchant = Keypair.generate();
    const customer = Keypair.generate();
    const { tx, signature } = await storePhoneIssues(merchant, customer.publicKey);
    const url = encodeCosignUrl(BASE_URL, { tx, storeName: 'Almacén Don Tito', ticket });

    expect(url).toContain('/?cosign=');
    const { envelope, inspected } = await neighborPhoneReads(url, customer.publicKey);
    expect(inspected.signature).toBe(signature);
    expect(envelope.ticket).toEqual(ticket);
  });

  it('el orden de las cuentas del mensaje no depende del teléfono: paga el almacén, sigue el vecino y el resto va por bytes', () => {
    const merchant = Keypair.generate().publicKey;
    const customer = Keypair.generate().publicKey;
    const instructions = [
      initializeCustomerIx(merchant, customer),
      issueFiadoIx({ merchant, customer, nonce: 1, amountMicroUsdc: AMOUNT, dueTimestamp: DUE, receiptHash: 'cd'.repeat(32) })
    ];
    const message = compileCosignMessage(merchant, instructions, BLOCKHASH);
    const keys = message.accountKeys;

    expect(message.header).toEqual({ numRequiredSignatures: 2, numReadonlySignedAccounts: 1, numReadonlyUnsignedAccounts: 2 });
    expect(keys[0].equals(merchant)).toBe(true);
    expect(keys[1].equals(customer)).toBe(true);
    // Cuentas con escritura (perfiles y fiado) y después las de solo lectura (programas), cada grupo en orden de bytes
    const isSorted = (group: PublicKey[]) => group.every((key, i) => i === 0 || Buffer.compare(group[i - 1].toBuffer(), key.toBuffer()) < 0);
    expect(isSorted(keys.slice(2, 5))).toBe(true);
    expect(isSorted(keys.slice(5))).toBe(true);
    expect(keys.slice(5).some(key => key.equals(SystemProgram.programId))).toBe(true);
    // Mismo resultado aunque las instrucciones lleguen armadas de nuevo
    const again = compileCosignMessage(merchant, [initializeCustomerIx(merchant, customer), instructions[1]], BLOCKHASH);
    expect(utils.bytes.bs58.encode(again.serialize())).toBe(utils.bytes.bs58.encode(message.serialize()));
  });

  it('ignora links que no son pedidos de co-firma y rechaza transacciones corruptas', () => {
    expect(parseCosignUrl('https://tef-iapp.vercel.app/')).toBeNull();
    expect(parseCosignUrl('hola')).toBeNull();
    expect(() => parseCosignUrl(`${BASE_URL}/?cosign=AAAA`)).toThrow(CosignError);
    expect(() => parseCosignUrl(`${BASE_URL}/?Q=AAAA`, Keypair.generate().publicKey)).toThrow(CosignError);
    expect(() => parseCosignUrl(`${BASE_URL}/?Q=no-es-base32`, Keypair.generate().publicKey)).toThrow(CosignError);
  });

  it('el QR del vecino lleva solo su clave pública y su nombre', () => {
    const address = Keypair.generate().publicKey.toBase58();
    const url = encodeNeighborUrl(BASE_URL, { address, name: 'Matías González' });

    expect(parseNeighborUrl(url)).toEqual({ address, name: 'Matías González' });
    expect(parseNeighborUrl(address)).toEqual({ address, name: '' });
    expect(parseNeighborUrl(`${BASE_URL}/?neighbor=no-es-una-clave`)).toBeNull();
    expect(parseNeighborUrl('hola')).toBeNull();
  });
});

describe('hash del comprobante', () => {
  const base = { merchant: Keypair.generate().publicKey, customer: Keypair.generate().publicKey, amountMicroUsdc: AMOUNT, dueTimestamp: DUE, ticket };

  it('es un SHA-256 en hex de 64 caracteres sin texto legible de la compra', async () => {
    const hash = await computeReceiptHash(base);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('Yerba');
  });

  it('es determinístico y cambia si cambia cualquier dato del ticket', async () => {
    const hash = await computeReceiptHash(base);
    expect(await computeReceiptHash({ ...base })).toBe(hash);
    expect(await computeReceiptHash({ ...base, ticket: { ...ticket, items: 'Yerba 1kg + 1 Pan' } })).not.toBe(hash);
    expect(await computeReceiptHash({ ...base, ticket: { ...ticket, amountArs: 1501 } })).not.toBe(hash);
    expect(await computeReceiptHash({ ...base, ticket: { ...ticket, photoSha256: '' } })).not.toBe(hash);
    expect(await computeReceiptHash({ ...base, amountMicroUsdc: AMOUNT + 1n })).not.toBe(hash);
    expect(await computeReceiptHash({ ...base, customer: Keypair.generate().publicKey })).not.toBe(hash);
  });
});
