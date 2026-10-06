// Conexión y utilidades reales para Solana Devnet con @solana/web3.js
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} from '@solana/web3.js';

export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';
export const PROGRAM_ID_STR = '3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc';
export const TEFI_PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);
export const INSURANCE_VAULT_PDA = 'HvmJdEQD7ZrU6jMVZjpUyLkNtJmQitRGxDPJsRhX3rE6';

// Instancia de conexión RPC a Solana Devnet con timeout rápido anti-bloqueo
export const solanaConnection = new Connection(SOLANA_DEVNET_RPC, {
  commitment: 'confirmed',
  disableRetryOnRateLimit: true
});

export function getSolanaExplorerUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
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

// Solicitar Airdrop de 1 SOL en Devnet (con control rápido de timeout y rate limits)
export async function requestDevnetAirdrop(publicKey: PublicKey): Promise<{ success: boolean; signature?: string; error?: string }> {
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
    let friendlyError = 'Límite de airdrop alcanzado o faucet de Devnet ocupado.';
    if (msg.includes('429') || msg.includes('limit') || msg.includes('Internal error')) {
      friendlyError = 'Límite diario del faucet de Solana alcanzado (máx. 1-2 SOL por día por IP).';
    } else if (msg.includes('TIMEOUT_DEVNET')) {
      friendlyError = 'El nodo de Solana tardó en responder. Reintentá en unos momentos.';
    }
    return { success: false, error: friendlyError };
  }
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

// Transmitir evento real a Solana Devnet (usando SPL Memo Program con firma y patrocinio de gas)
export async function broadcastSolanaFiadoEvent(
  payer: Keypair,
  eventData: { type: 'NEW_FIADO' | 'REPAY' | 'INSURANCE_CLAIM'; fiadoId: string; amountUsdc: number },
  sponsorKeypair?: Keypair
): Promise<string | null> {
  try {
    let effectiveFeePayer = payer;
    const balance = await getDevnetBalance(payer.publicKey);

    // Si el payer no tiene saldo, usar el sponsor (ej: almacén financia al vecino)
    if (balance < 0.002) {
      if (sponsorKeypair) {
        const sponsorBalance = await getDevnetBalance(sponsorKeypair.publicKey);
        if (sponsorBalance >= 0.002) {
          effectiveFeePayer = sponsorKeypair;
        }
      }
    }

    const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: memoProgramId,
      data: Buffer.from(
        JSON.stringify({
          app: 'tefi.app',
          event: eventData.type,
          fiadoId: eventData.fiadoId,
          usdc: eventData.amountUsdc,
          timestamp: Date.now()
        })
      )
    });

    const tx = new Transaction().add(memoInstruction);
    tx.feePayer = effectiveFeePayer.publicKey;

    const signers = effectiveFeePayer.publicKey.equals(payer.publicKey)
      ? [payer]
      : [payer, effectiveFeePayer];

    const signature = await sendAndConfirmTransaction(solanaConnection, tx, signers, {
      commitment: 'confirmed'
    });
    console.log(`[Tefi on-chain] Transacción real confirmada en Devnet: ${signature}`);
    return signature;
  } catch (err) {
    console.warn('[Tefi on-chain] Error al transmitir transacción en Devnet:', err);
    return null;
  }
}

