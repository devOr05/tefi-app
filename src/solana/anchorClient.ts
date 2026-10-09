import { Buffer } from 'buffer';
import { AnchorProvider, Program, BN, Idl } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import idl from './idl.json';
import { solanaConnection, TEFI_PROGRAM_ID } from './connection';

// Implementación de billetera en memoria para AnchorProvider
export class KeypairWallet {
  constructor(readonly payer: Keypair) {}

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    } else if (tx instanceof VersionedTransaction) {
      tx.sign([this.payer]);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map((t) => this.signTransaction(t)));
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
}

// Obtener cliente de programa Anchor vinculado a un keypair pagador
export function getTefiProgram(payer: Keypair): Program {
  const wallet = new KeypairWallet(payer);
  const provider = new AnchorProvider(solanaConnection, wallet as any, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed'
  });
  return new Program(idl as Idl, TEFI_PROGRAM_ID, provider);
}

// -------------------------------------------------------------
// DERIVACIÓN DE PDAs
// -------------------------------------------------------------

export function getMerchantProfilePda(merchantPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('merchant'), merchantPubkey.toBuffer()],
    TEFI_PROGRAM_ID
  );
}

export function getCustomerProfilePda(customerPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('customer'), customerPubkey.toBuffer()],
    TEFI_PROGRAM_ID
  );
}

export function getFiadoRecordPda(
  merchantPubkey: PublicKey,
  customerPubkey: PublicKey,
  nonce: number | bigint
): [PublicKey, number] {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(BigInt(nonce));
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('fiado'),
      merchantPubkey.toBuffer(),
      customerPubkey.toBuffer(),
      nonceBuffer
    ],
    TEFI_PROGRAM_ID
  );
}

// -------------------------------------------------------------
// CONSULTAS ON-CHAIN (READ STATE)
// -------------------------------------------------------------

export interface OnChainCustomerProfile {
  creditScore: number;
  creditLimitUsdc: number;
  activeDebtUsdc: number;
  totalRepaidUsdc: number;
  loyaltyPoints: number;
}

export async function fetchOnChainCustomerProfile(
  customerPubkey: PublicKey,
  callerKeypair?: Keypair
): Promise<OnChainCustomerProfile | null> {
  try {
    const dummyKp = callerKeypair || Keypair.generate();
    const program = getTefiProgram(dummyKp);
    const [pda] = getCustomerProfilePda(customerPubkey);
    
    const acc = (await program.account.customerProfile.fetch(pda)) as any;
    if (!acc) return null;

    return {
      creditScore: Number(acc.creditScore),
      creditLimitUsdc: acc.creditLimitUsdc.toNumber() / 1_000_000,
      activeDebtUsdc: acc.activeDebtUsdc.toNumber() / 1_000_000,
      totalRepaidUsdc: acc.totalRepaidUsdc.toNumber() / 1_000_000,
      loyaltyPoints: Number(acc.loyaltyPoints)
    };
  } catch (err) {
    return null;
  }
}

export async function fetchOnChainMerchantProfile(
  merchantPubkey: PublicKey,
  callerKeypair?: Keypair
) {
  try {
    const dummyKp = callerKeypair || Keypair.generate();
    const program = getTefiProgram(dummyKp);
    const [pda] = getMerchantProfilePda(merchantPubkey);

    const acc = await program.account.merchantProfile.fetch(pda);
    return acc;
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// INSTRUCCIONES ON-CHAIN (WRITE STATE)
// -------------------------------------------------------------

/**
 * Asegura que el comercio y el cliente estén inicializados en Devnet antes de emitir fiados
 */
export async function ensureProfilesInitialized(
  merchantKeypair: Keypair,
  customerKeypair: Keypair,
  businessName = 'Almacén Don Tito',
  category = 'Almacén de Barrio'
): Promise<void> {
  const program = getTefiProgram(merchantKeypair);

  // 1. Verificar Merchant
  const [merchantPda] = getMerchantProfilePda(merchantKeypair.publicKey);
  const merchantInfo = await solanaConnection.getAccountInfo(merchantPda);
  if (!merchantInfo) {
    console.log('[Tefi Anchor] Inicializando MerchantProfile on-chain...');
    await program.methods
      .initializeMerchant(businessName, category)
      .accounts({
        merchant: merchantKeypair.publicKey,
        merchantProfile: merchantPda,
        systemProgram: SystemProgram.programId
      })
      .signers([merchantKeypair])
      .rpc();
    console.log('[Tefi Anchor] MerchantProfile inicializado con éxito');
  }

  // 2. Verificar Customer
  const [customerPda] = getCustomerProfilePda(customerKeypair.publicKey);
  const customerInfo = await solanaConnection.getAccountInfo(customerPda);
  if (!customerInfo) {
    console.log('[Tefi Anchor] Inicializando CustomerProfile on-chain...');
    const custProgram = getTefiProgram(customerKeypair);
    await custProgram.methods
      .initializeCustomer()
      .accounts({
        customer: customerKeypair.publicKey,
        customerProfile: customerPda,
        systemProgram: SystemProgram.programId
      })
      .signers([customerKeypair])
      .rpc();
    console.log('[Tefi Anchor] CustomerProfile inicializado con éxito');
  }
}

/**
 * Emitir fiado con firma bilateral en Solana Devnet (merchant + customer)
 */
export async function executeOnChainIssueFiado(
  merchantKeypair: Keypair,
  customerKeypair: Keypair,
  amountUsdc: number,
  dueTimestampMs: number,
  receiptHash: string
): Promise<{ signature: string; fiadoRecordPda: PublicKey; nonce: number }> {
  await ensureProfilesInitialized(merchantKeypair, customerKeypair);

  const program = getTefiProgram(merchantKeypair);
  const [merchantPda] = getMerchantProfilePda(merchantKeypair.publicKey);
  const [customerPda] = getCustomerProfilePda(customerKeypair.publicKey);

  const merchantAccount = (await program.account.merchantProfile.fetch(merchantPda)) as any;
  const nonce = merchantAccount.fiadoNonce.toNumber();

  const [fiadoRecordPda] = getFiadoRecordPda(
    merchantKeypair.publicKey,
    customerKeypair.publicKey,
    nonce
  );

  const amountMicroUsdc = new BN(Math.round(amountUsdc * 1_000_000));
  const dueTimestampSec = new BN(Math.floor(dueTimestampMs / 1000));
  const safeHash = (receiptHash || 'receipt_hash_tefi').slice(0, 64);

  console.log(`[Tefi Anchor] Ejecutando issueFiado: ${amountUsdc} USDC, nonce: ${nonce}...`);
  const signature = await program.methods
    .issueFiado(amountMicroUsdc, dueTimestampSec, safeHash)
    .accounts({
      merchant: merchantKeypair.publicKey,
      customer: customerKeypair.publicKey,
      merchantProfile: merchantPda,
      customerProfile: customerPda,
      fiadoRecord: fiadoRecordPda,
      systemProgram: SystemProgram.programId
    })
    .signers([merchantKeypair, customerKeypair])
    .rpc();

  console.log(`[Tefi Anchor] issueFiado exitoso! Tx: ${signature}`);
  return { signature, fiadoRecordPda, nonce };
}

/**
 * Repagar fiado en Solana Devnet (actualiza score on-chain +5, límite y puntos)
 * Exige co-firma bilateral estricta: el almacén confirma el cobro y el cliente salda la deuda.
 * Si falta cualquiera de las dos firmas, la transacción falla de forma explícita.
 */
export async function executeOnChainRepayFiado(
  merchantKeypair: Keypair,
  customerKeypair: Keypair,
  fiadoNonce: number
): Promise<{ signature: string }> {
  if (!merchantKeypair?.publicKey || !customerKeypair?.publicKey) {
    throw new Error('RepayFiado exige obligatoriamente las firmas de ambos: comercio y cliente.');
  }

  const [customerPda] = getCustomerProfilePda(customerKeypair.publicKey);
  const [fiadoRecordPda] = getFiadoRecordPda(
    merchantKeypair.publicKey,
    customerKeypair.publicKey,
    fiadoNonce
  );

  console.log(`[Tefi Anchor] Ejecutando repayFiado bilateral (Almacén + Vecino) para fiado nonce ${fiadoNonce}...`);

  const program = getTefiProgram(merchantKeypair);
  const signature = await program.methods
    .repayFiado()
    .accounts({
      merchant: merchantKeypair.publicKey,
      customer: customerKeypair.publicKey,
      customerProfile: customerPda,
      fiadoRecord: fiadoRecordPda,
      systemProgram: SystemProgram.programId
    })
    .signers([merchantKeypair, customerKeypair])
    .rpc();

  console.log(`[Tefi Anchor] repayFiado bilateral confirmado en Devnet! Tx: ${signature}`);
  return { signature };
}
