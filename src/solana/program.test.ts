import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BN, BorshAccountsCoder, Idl } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import idl from './idl.json';
import {
  MICRO_USDC,
  PROGRAM_ID_STR,
  TEFI_PROGRAM_ID,
  decodeCustomerProfile,
  decodeFiadoRecord,
  decodeMerchantProfile,
  decodeTefiInstruction,
  getCustomerProfilePda,
  getFiadoRecordPda,
  getMerchantProfilePda,
  initializeCustomerIx,
  initializeMerchantIx,
  issueFiadoIx,
  programErrorMessage,
  repayFiadoIx
} from './program';

const accountsCoder = new BorshAccountsCoder(idl as Idl);
const merchant = Keypair.generate().publicKey;
const customer = Keypair.generate().publicKey;
const signers = (keys: { pubkey: PublicKey; isSigner: boolean }[]) => keys.filter(k => k.isSigner).map(k => k.pubkey.toBase58());

describe('program id', () => {
  it('es el mismo en el cliente, el IDL, Anchor.toml y declare_id! del programa', () => {
    const anchorToml = readFileSync('contracts/tefi_program/Anchor.toml', 'utf8');
    const libRs = readFileSync('contracts/tefi_program/programs/tefi_program/src/lib.rs', 'utf8');

    expect(idl.metadata.address).toBe(PROGRAM_ID_STR);
    expect(libRs).toContain(`declare_id!("${PROGRAM_ID_STR}");`);
    expect(anchorToml.match(/^tefi_program = "(.+)"$/gm)).toEqual([
      `tefi_program = "${PROGRAM_ID_STR}"`,
      `tefi_program = "${PROGRAM_ID_STR}"`
    ]);
  });
});

describe('PDAs', () => {
  it('se derivan con las mismas seeds que el programa', () => {
    const nonce = Buffer.alloc(8);
    nonce.writeBigUInt64LE(5n);

    expect(getMerchantProfilePda(merchant)).toEqual(
      PublicKey.findProgramAddressSync([Buffer.from('merchant'), merchant.toBuffer()], TEFI_PROGRAM_ID)[0]
    );
    expect(getCustomerProfilePda(customer)).toEqual(
      PublicKey.findProgramAddressSync([Buffer.from('customer'), customer.toBuffer()], TEFI_PROGRAM_ID)[0]
    );
    expect(getFiadoRecordPda(merchant, customer, 5)).toEqual(
      PublicKey.findProgramAddressSync([Buffer.from('fiado'), merchant.toBuffer(), customer.toBuffer(), nonce], TEFI_PROGRAM_ID)[0]
    );
  });

  it('cada fiado tiene su propia cuenta: cambia con el nonce, el almacén o el vecino', () => {
    const base = getFiadoRecordPda(merchant, customer, 0).toBase58();
    expect(getFiadoRecordPda(merchant, customer, 1).toBase58()).not.toBe(base);
    expect(getFiadoRecordPda(Keypair.generate().publicKey, customer, 0).toBase58()).not.toBe(base);
    expect(getFiadoRecordPda(merchant, Keypair.generate().publicKey, 0).toBase58()).not.toBe(base);
  });
});

describe('instrucciones', () => {
  it('issue_fiado exige las firmas del almacén y del vecino, y solo el almacén paga', () => {
    const ix = issueFiadoIx({ merchant, customer, nonce: 2, amountMicroUsdc: 930_000n, dueTimestamp: 1_800_000_000, receiptHash: 'ab'.repeat(32) });

    expect(ix.programId.equals(TEFI_PROGRAM_ID)).toBe(true);
    expect(signers(ix.keys)).toEqual([merchant.toBase58(), customer.toBase58()]);
    expect(ix.keys[0].isWritable).toBe(true); // el almacén paga el rent del FiadoRecord
    expect(ix.keys[1].isWritable).toBe(false); // el vecino solo firma
    expect(ix.keys[4].pubkey.equals(getFiadoRecordPda(merchant, customer, 2))).toBe(true);
    expect(ix.keys[5].pubkey.equals(SystemProgram.programId)).toBe(true);
    expect(decodeTefiInstruction(ix)).toEqual({
      name: 'issueFiado',
      amountMicroUsdc: 930_000n,
      dueTimestamp: 1_800_000_000,
      receiptHash: 'ab'.repeat(32)
    });
  });

  it('repay_fiado exige las dos firmas: el vecino no puede saldarse solo', () => {
    const ix = repayFiadoIx({ merchant, customer, nonce: 2 });

    expect(signers(ix.keys)).toEqual([merchant.toBase58(), customer.toBase58()]);
    expect(ix.keys[3].pubkey.equals(getFiadoRecordPda(merchant, customer, 2))).toBe(true);
    expect(decodeTefiInstruction(ix)).toEqual({ name: 'repayFiado' });
  });

  it('initialize_customer: el almacén paga el alta y el vecino solo firma', () => {
    const ix = initializeCustomerIx(merchant, customer);

    expect(signers(ix.keys)).toEqual([merchant.toBase58(), customer.toBase58()]);
    expect(ix.keys[0]).toMatchObject({ isSigner: true, isWritable: true });
    expect(ix.keys[1]).toMatchObject({ isSigner: true, isWritable: false });
    expect(ix.keys[2].pubkey.equals(getCustomerProfilePda(customer))).toBe(true);
    expect(decodeTefiInstruction(ix)).toEqual({ name: 'initializeCustomer' });
  });

  it('initialize_merchant solo lo firma el almacén', () => {
    const ix = initializeMerchantIx(merchant, 'Almacén Don Tito', 'Almacén de Barrio');
    expect(signers(ix.keys)).toEqual([merchant.toBase58()]);
    expect(decodeTefiInstruction(ix)).toEqual({ name: 'initializeMerchant' });
  });

  it('no reconoce instrucciones de otros programas', () => {
    const transfer = SystemProgram.transfer({ fromPubkey: customer, toPubkey: merchant, lamports: 1 });
    expect(decodeTefiInstruction(transfer)).toBeNull();
  });
});

describe('cuentas on-chain', () => {
  it('decodifica el perfil crediticio del vecino en USDC', async () => {
    const data = await accountsCoder.encode('CustomerProfile', {
      owner: customer,
      creditScore: 70,
      creditLimitUsdc: new BN(55 * MICRO_USDC),
      activeDebtUsdc: new BN(930_000),
      totalRepaidUsdc: new BN(12 * MICRO_USDC),
      loyaltyPoints: 240,
      bump: 254
    });

    expect(decodeCustomerProfile(data)).toEqual({
      owner: customer.toBase58(),
      creditScore: 70,
      creditLimitUsdc: 55,
      activeDebtUsdc: 0.93,
      totalRepaidUsdc: 12,
      loyaltyPoints: 240
    });
  });

  it('decodifica el perfil del almacén con su contador de fiados', async () => {
    const data = await accountsCoder.encode('MerchantProfile', {
      owner: merchant,
      businessName: 'Almacén Don Tito',
      category: 'Almacén de Barrio',
      totalSalesUsdc: new BN(15 * MICRO_USDC),
      totalDefaultedUsdc: new BN(0),
      defaultRateBps: 0,
      insuranceFeeBps: 250,
      fiadoNonce: new BN(3),
      bump: 255
    });

    expect(decodeMerchantProfile(data)).toMatchObject({ businessName: 'Almacén Don Tito', totalSalesUsdc: 15, fiadoNonce: 3 });
  });

  it('decodifica un fiado y traduce su estado', async () => {
    const address = getFiadoRecordPda(merchant, customer, 3);
    const encode = (status: number) =>
      accountsCoder.encode('FiadoRecord', {
        merchant,
        customer,
        amountUsdc: new BN(930_000),
        dueTimestamp: new BN(1_800_000_000),
        receiptHash: 'ab'.repeat(32),
        nonce: new BN(3),
        status,
        bump: 253
      });

    expect(decodeFiadoRecord(address, await encode(1))).toEqual({
      address: address.toBase58(),
      merchant: merchant.toBase58(),
      customer: customer.toBase58(),
      amountUsdc: 0.93,
      dueTimestamp: 1_800_000_000,
      receiptHash: 'ab'.repeat(32),
      nonce: 3,
      status: 'ACTIVE'
    });
    expect(decodeFiadoRecord(address, await encode(2)).status).toBe('PAID');
    expect(decodeFiadoRecord(address, await encode(3)).status).toBe('INSURANCE_CLAIMED');
  });
});

describe('errores del programa', () => {
  it('traduce los códigos de error del programa', () => {
    expect(programErrorMessage(6000)).toContain('límite de crédito');
    expect(programErrorMessage(6008)).toContain('SHA-256');
    expect(programErrorMessage(1)).toBeNull();
  });
});
