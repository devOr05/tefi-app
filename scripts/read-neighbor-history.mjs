#!/usr/bin/env node
// Reads a neighbor's credit history straight from Solana Devnet, the way a third-party lender would:
// only the neighbor's public key and an RPC endpoint are needed. No Tefi server is involved.
//
// Usage: node scripts/read-neighbor-history.mjs <neighbor public key>
import { readFileSync } from 'node:fs';
import anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

const idl = JSON.parse(readFileSync(new URL('../src/solana/idl.json', import.meta.url), 'utf8'));
const PROGRAM_ID = new PublicKey(idl.metadata.address);
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const FIADO_CUSTOMER_OFFSET = 40; // 8 (discriminator) + 32 (merchant)
const STATUS = { 1: 'ACTIVE', 2: 'PAID', 3: 'DEFAULTED' };

const [neighborArg] = process.argv.slice(2);
if (!neighborArg) {
  console.error('Usage: node scripts/read-neighbor-history.mjs <neighbor public key>');
  process.exit(1);
}

const neighbor = new PublicKey(neighborArg);
const connection = new Connection(RPC_URL, 'confirmed');
const coder = new anchor.BorshAccountsCoder(idl);
const usdc = amount => (Number(amount.toString()) / 1_000_000).toFixed(2);

const [profilePda] = PublicKey.findProgramAddressSync([Buffer.from('customer'), neighbor.toBuffer()], PROGRAM_ID);
const profileInfo = await connection.getAccountInfo(profilePda);

console.log(`Program:      ${PROGRAM_ID.toBase58()}`);
console.log(`Neighbor:     ${neighbor.toBase58()}`);
console.log(`Profile PDA:  ${profilePda.toBase58()}`);

if (!profileInfo) {
  console.log('\nNo on-chain history: this neighbor has not co-signed a fiado yet.');
  process.exit(0);
}

const profile = coder.decode('CustomerProfile', profileInfo.data);
console.log(`\nCredit score:   ${profile.creditScore} / 100`);
console.log(`Credit limit:   ${usdc(profile.creditLimitUsdc)} USDC`);
console.log(`Active debt:    ${usdc(profile.activeDebtUsdc)} USDC`);
console.log(`Repaid to date: ${usdc(profile.totalRepaidUsdc)} USDC`);

const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
  filters: [
    { memcmp: { offset: 0, bytes: anchor.utils.bytes.bs58.encode(anchor.BorshAccountsCoder.accountDiscriminator('FiadoRecord')) } },
    { memcmp: { offset: FIADO_CUSTOMER_OFFSET, bytes: neighbor.toBase58() } }
  ]
});
const fiados = accounts
  .map(({ pubkey, account }) => ({ address: pubkey.toBase58(), ...coder.decode('FiadoRecord', account.data) }))
  .sort((a, b) => Number(a.dueTimestamp.toString()) - Number(b.dueTimestamp.toString()));

console.log(`\nFiados co-signed with stores: ${fiados.length}`);
for (const fiado of fiados) {
  const due = new Date(Number(fiado.dueTimestamp.toString()) * 1000).toISOString().slice(0, 10);
  console.log(
    `  ${(STATUS[fiado.status] || 'UNKNOWN').padEnd(9)} ${usdc(fiado.amountUsdc).padStart(8)} USDC  due ${due}  store ${fiado.merchant.toBase58()}  account ${fiado.address}`
  );
}
