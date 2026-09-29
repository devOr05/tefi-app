// Conexión y utilidades reales para Solana Devnet con @solana/web3.js
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';
export const PROGRAM_ID_STR = 'H7afUaQecBwFRLRahfAQSM7ZdGXRfX5TiBEPQgahMHdr';
export const TEFI_PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);
export const INSURANCE_VAULT_PDA = 'HvmJdEQD7ZrU6jMVZjpUyLkNtJmQitRGxDPJsRhX3rE6';

// Instancia de conexión RPC a Solana Devnet
export const solanaConnection = new Connection(SOLANA_DEVNET_RPC, 'confirmed');

export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getSolanaAccountUrl(pubkey: string): string {
  return `https://solscan.io/account/${pubkey}?cluster=devnet`;
}

// Billetera criptográfica embebida en el dispositivo (Keypair real persistente)
export function getOrCreateRoleKeypair(role: 'merchant' | 'customer'): Keypair {
  const storageKey = `tefi_keypair_${role}`;
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

// Solicitar Airdrop de 1 SOL en Devnet
export async function requestDevnetAirdrop(publicKey: PublicKey): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const sig = await solanaConnection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
    const latestBlockhash = await solanaConnection.getLatestBlockhash();
    await solanaConnection.confirmTransaction({
      signature: sig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });
    return { success: true, signature: sig };
  } catch (err: any) {
    console.error('Error al solicitar airdrop en Devnet:', err);
    return { success: false, error: err.message || 'Límite de airdrop alcanzado o RPC ocupado.' };
  }
}

// Generador de firmas para eventos off-chain cuando el programa simulado registra el fiado
export function generateMockSolanaSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}

// Health check para Solana Devnet
export async function pingSolanaDevnet(): Promise<boolean> {
  try {
    const res = await fetch(SOLANA_DEVNET_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    const data = await res.json();
    return data.result === 'ok';
  } catch (e) {
    return false;
  }
}
