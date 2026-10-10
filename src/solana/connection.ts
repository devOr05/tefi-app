// Conexión y utilidades reales para Solana Devnet con @solana/web3.js
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction
} from '@solana/web3.js';

export { PROGRAM_ID_STR, TEFI_PROGRAM_ID } from './program';

export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';

// Instancia de conexión RPC a Solana Devnet con timeout rápido anti-bloqueo
export const solanaConnection = new Connection(SOLANA_DEVNET_RPC, {
  commitment: 'confirmed',
  disableRetryOnRateLimit: true
});

export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getSolanaAccountUrl(pubkey: string): string {
  return `https://explorer.solana.com/address/${pubkey}?cluster=devnet`;
}

// -------------------------------------------------------------
// CLAVES DEL DISPOSITIVO
// -------------------------------------------------------------
// Cada teléfono guarda SOLO la clave del rol que usa: el del almacén la del almacén y el del vecino
// la del vecino. La clave de un rol se crea recién la primera vez que ese rol se usa en el dispositivo.
// Prototipo en devnet: las claves viven en localStorage, no apto para dinero ni datos reales.

export type DeviceRole = 'merchant' | 'customer';

const keypairStorageKey = (role: DeviceRole) => `tefi_keypair_${role}`;

export function hasRoleKeypair(role: DeviceRole): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage.getItem(keypairStorageKey(role));
  } catch (e) {
    return false;
  }
}

export function getOrCreateRoleKeypair(role: DeviceRole): Keypair {
  const storageKey = keypairStorageKey(role);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = window.localStorage.getItem(storageKey);
      if (existing) {
        const secretKey = Uint8Array.from(JSON.parse(existing));
        return Keypair.fromSecretKey(secretKey);
      }
    }
  } catch (e) {
    console.warn('Error al restaurar Keypair, generando uno nuevo...', e);
  }

  const newKeypair = Keypair.generate();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(newKeypair.secretKey)));
    }
  } catch (e) {
    console.warn('No se pudo persistir el keypair en localStorage:', e);
  }
  return newKeypair;
}

export function storeRoleKeypair(role: DeviceRole, keypair: Keypair): void {
  window.localStorage.setItem(keypairStorageKey(role), JSON.stringify(Array.from(keypair.secretKey)));
}

export function forgetRoleKeypair(role: DeviceRole): void {
  try {
    window.localStorage.removeItem(keypairStorageKey(role));
  } catch (e) {
    console.warn('No se pudo borrar el keypair de localStorage:', e);
  }
}

// -------------------------------------------------------------
// SALDO Y FONDEO EN DEVNET
// -------------------------------------------------------------

// Consultar saldo de SOL en Devnet
export async function getDevnetBalance(publicKey: PublicKey): Promise<number> {
  try {
    const lamports = await solanaConnection.getBalance(publicKey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (e) {
    console.warn('No se pudo consultar el saldo en Devnet:', e);
    return 0;
  }
}

// Motivo por el que el faucet no entregó SOL; el texto para el usuario lo arma la interfaz según el idioma
export type AirdropFailure = 'RATE_LIMITED' | 'TIMEOUT' | 'UNAVAILABLE';

// Solicitar Airdrop de 1 SOL en Devnet (con control rápido de timeout y rate limits)
export async function requestDevnetAirdrop(publicKey: PublicKey): Promise<{ success: boolean; signature?: string; error?: AirdropFailure }> {
  try {
    const airdropPromise = (async () => {
      const sig = await solanaConnection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      const latestBlockhash = await solanaConnection.getLatestBlockhash();
      await solanaConnection.confirmTransaction({
        signature: sig,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      });
      return sig;
    })();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_DEVNET')), 6000)
    );

    const sig = await Promise.race([airdropPromise, timeoutPromise]);
    return { success: true, signature: sig };
  } catch (err: any) {
    console.warn('[Solana Devnet Faucet] Respuesta del faucet:', err?.message || err);
    const msg = err?.message || '';
    let failure: AirdropFailure = 'UNAVAILABLE';
    if (msg.includes('429') || msg.includes('limit') || msg.includes('Internal error')) {
      failure = 'RATE_LIMITED';
    } else if (msg.includes('TIMEOUT_DEVNET')) {
      failure = 'TIMEOUT';
    }
    return { success: false, error: failure };
  }
}

// Mover todo el SOL de devnet de una clave a otra (al renovar la identidad del almacén en un reset)
export async function sweepDevnetSol(fromKeypair: Keypair, toPubkey: PublicKey): Promise<string | null> {
  const FEE_LAMPORTS = 5000;
  try {
    const lamports = (await solanaConnection.getBalance(fromKeypair.publicKey)) - FEE_LAMPORTS;
    if (lamports <= 0) return null;
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: fromKeypair.publicKey, toPubkey, lamports })
    );
    return await sendAndConfirmTransaction(solanaConnection, tx, [fromKeypair], { commitment: 'confirmed' });
  } catch (err) {
    console.warn('No se pudo trasladar el SOL de devnet a la nueva clave:', err);
    return null;
  }
}
