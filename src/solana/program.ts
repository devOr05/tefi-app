// Programa Anchor de Tefi: IDs, PDAs, instrucciones y decodificación de cuentas.
// Módulo puro (sin red ni almacenamiento) para poder testearlo importándolo tal cual.
import { Buffer } from 'buffer';
import { BN, BorshAccountsCoder, BorshInstructionCoder, Idl } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import idl from './idl.json';

export const PROGRAM_ID_STR = '9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ';
export const TEFI_PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

export const MICRO_USDC = 1_000_000;
// Valores con los que initialize_customer crea el perfil del vecino en el programa
export const BASE_CREDIT_SCORE = 65;
export const BASE_CREDIT_LIMIT_USDC = 50;

const instructionCoder = new BorshInstructionCoder(idl as Idl);
const accountsCoder = new BorshAccountsCoder(idl as Idl);

// -------------------------------------------------------------
// DERIVACIÓN DE PDAs
// -------------------------------------------------------------

export function getMerchantProfilePda(merchantPubkey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('merchant'), merchantPubkey.toBuffer()],
    TEFI_PROGRAM_ID
  )[0];
}

export function getCustomerProfilePda(customerPubkey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('customer'), customerPubkey.toBuffer()],
    TEFI_PROGRAM_ID
  )[0];
}

export function getFiadoRecordPda(
  merchantPubkey: PublicKey,
  customerPubkey: PublicKey,
  nonce: number | bigint
): PublicKey {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(BigInt(nonce));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('fiado'), merchantPubkey.toBuffer(), customerPubkey.toBuffer(), nonceBuffer],
    TEFI_PROGRAM_ID
  )[0];
}

// -------------------------------------------------------------
// INSTRUCCIONES
// -------------------------------------------------------------

type InstructionName = 'initializeMerchant' | 'initializeCustomer' | 'issueFiado' | 'repayFiado' | 'claimInsurance';

// Las cuentas (orden, firmantes y permisos) salen del IDL para no desalinearse del programa
function buildInstruction(
  name: InstructionName,
  accounts: Record<string, PublicKey>,
  args: Record<string, unknown> = {}
): TransactionInstruction {
  const definition = idl.instructions.find(ix => ix.name === name);
  if (!definition) throw new Error(`Instrucción desconocida en el IDL: ${name}`);

  const keys = definition.accounts.map(account => {
    const pubkey = accounts[account.name];
    if (!pubkey) throw new Error(`Falta la cuenta '${account.name}' para ${name}`);
    return { pubkey, isSigner: account.isSigner, isWritable: account.isMut };
  });

  return new TransactionInstruction({
    programId: TEFI_PROGRAM_ID,
    keys,
    data: instructionCoder.encode(name, args)
  });
}

export function initializeMerchantIx(merchant: PublicKey, businessName: string, category: string): TransactionInstruction {
  return buildInstruction(
    'initializeMerchant',
    { merchant, merchantProfile: getMerchantProfilePda(merchant), systemProgram: SystemProgram.programId },
    { businessName, category }
  );
}

export function initializeCustomerIx(payer: PublicKey, customer: PublicKey): TransactionInstruction {
  return buildInstruction('initializeCustomer', {
    payer,
    customer,
    customerProfile: getCustomerProfilePda(customer),
    systemProgram: SystemProgram.programId
  });
}

export function issueFiadoIx(params: {
  merchant: PublicKey;
  customer: PublicKey;
  nonce: number | bigint;
  amountMicroUsdc: bigint;
  dueTimestamp: number;
  receiptHash: string;
}): TransactionInstruction {
  const { merchant, customer, nonce, amountMicroUsdc, dueTimestamp, receiptHash } = params;
  return buildInstruction(
    'issueFiado',
    {
      merchant,
      customer,
      merchantProfile: getMerchantProfilePda(merchant),
      customerProfile: getCustomerProfilePda(customer),
      fiadoRecord: getFiadoRecordPda(merchant, customer, nonce),
      systemProgram: SystemProgram.programId
    },
    {
      amountUsdc: new BN(amountMicroUsdc.toString()),
      dueTimestamp: new BN(dueTimestamp),
      receiptHash
    }
  );
}

export function repayFiadoIx(params: { merchant: PublicKey; customer: PublicKey; nonce: number | bigint }): TransactionInstruction {
  const { merchant, customer, nonce } = params;
  return buildInstruction('repayFiado', {
    merchant,
    customer,
    customerProfile: getCustomerProfilePda(customer),
    fiadoRecord: getFiadoRecordPda(merchant, customer, nonce),
    systemProgram: SystemProgram.programId
  });
}

export type DecodedTefiInstruction =
  | { name: 'initializeMerchant' | 'initializeCustomer' | 'repayFiado' | 'claimInsurance' }
  | { name: 'issueFiado'; amountMicroUsdc: bigint; dueTimestamp: number; receiptHash: string };

/** Decodifica una instrucción del programa Tefi; devuelve null si no es del programa o no se reconoce. */
export function decodeTefiInstruction(ix: TransactionInstruction): DecodedTefiInstruction | null {
  if (!ix.programId.equals(TEFI_PROGRAM_ID)) return null;
  const decoded = instructionCoder.decode(Buffer.from(ix.data));
  if (!decoded) return null;

  if (decoded.name === 'issueFiado') {
    const data = decoded.data as { amountUsdc: BN; dueTimestamp: BN; receiptHash: string };
    return {
      name: 'issueFiado',
      amountMicroUsdc: BigInt(data.amountUsdc.toString()),
      dueTimestamp: data.dueTimestamp.toNumber(),
      receiptHash: data.receiptHash
    };
  }
  return { name: decoded.name as Exclude<InstructionName, 'issueFiado'> };
}

// -------------------------------------------------------------
// CUENTAS ON-CHAIN
// -------------------------------------------------------------

export interface OnChainCustomerProfile {
  owner: string;
  creditScore: number;
  creditLimitUsdc: number;
  activeDebtUsdc: number;
  totalRepaidUsdc: number;
  loyaltyPoints: number;
}

export interface OnChainMerchantProfile {
  owner: string;
  businessName: string;
  category: string;
  totalSalesUsdc: number;
  totalDefaultedUsdc: number;
  defaultRateBps: number;
  insuranceFeeBps: number;
  fiadoNonce: number;
}

export type OnChainFiadoStatus = 'ACTIVE' | 'PAID' | 'INSURANCE_CLAIMED';

export interface OnChainFiado {
  address: string;
  merchant: string;
  customer: string;
  amountUsdc: number;
  dueTimestamp: number;
  receiptHash: string;
  nonce: number;
  status: OnChainFiadoStatus;
}

const fromMicroUsdc = (value: BN): number => Number(value.toString()) / MICRO_USDC;

const FIADO_STATUS_BY_CODE: Record<number, OnChainFiadoStatus> = {
  1: 'ACTIVE',
  2: 'PAID',
  3: 'INSURANCE_CLAIMED'
};

export function decodeCustomerProfile(data: Buffer | Uint8Array): OnChainCustomerProfile {
  const acc = accountsCoder.decode('CustomerProfile', Buffer.from(data));
  return {
    owner: acc.owner.toBase58(),
    creditScore: Number(acc.creditScore),
    creditLimitUsdc: fromMicroUsdc(acc.creditLimitUsdc),
    activeDebtUsdc: fromMicroUsdc(acc.activeDebtUsdc),
    totalRepaidUsdc: fromMicroUsdc(acc.totalRepaidUsdc),
    loyaltyPoints: Number(acc.loyaltyPoints)
  };
}

export function decodeMerchantProfile(data: Buffer | Uint8Array): OnChainMerchantProfile {
  const acc = accountsCoder.decode('MerchantProfile', Buffer.from(data));
  return {
    owner: acc.owner.toBase58(),
    businessName: acc.businessName,
    category: acc.category,
    totalSalesUsdc: fromMicroUsdc(acc.totalSalesUsdc),
    totalDefaultedUsdc: fromMicroUsdc(acc.totalDefaultedUsdc),
    defaultRateBps: Number(acc.defaultRateBps),
    insuranceFeeBps: Number(acc.insuranceFeeBps),
    fiadoNonce: Number(acc.fiadoNonce.toString())
  };
}

export function decodeFiadoRecord(address: PublicKey, data: Buffer | Uint8Array): OnChainFiado {
  const acc = accountsCoder.decode('FiadoRecord', Buffer.from(data));
  return {
    address: address.toBase58(),
    merchant: acc.merchant.toBase58(),
    customer: acc.customer.toBase58(),
    amountUsdc: fromMicroUsdc(acc.amountUsdc),
    dueTimestamp: Number(acc.dueTimestamp.toString()),
    receiptHash: acc.receiptHash,
    nonce: Number(acc.nonce.toString()),
    status: FIADO_STATUS_BY_CODE[Number(acc.status)] ?? 'ACTIVE'
  };
}

// Offsets de FiadoRecord para filtrar con getProgramAccounts: 8 (discriminador) + merchant (32) + customer (32)
export const FIADO_MERCHANT_OFFSET = 8;
export const FIADO_CUSTOMER_OFFSET = 40;

export function fiadoRecordDiscriminator(): Buffer {
  return BorshAccountsCoder.accountDiscriminator('FiadoRecord');
}

/** Mensaje del programa para un código de error Anchor (6000+), tal como figura en el IDL. */
export function programErrorMessage(code: number): string | null {
  return idl.errors.find(e => e.code === code)?.msg ?? null;
}
