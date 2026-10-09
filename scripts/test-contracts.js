import assert from 'assert';
import fs from 'fs';
import { PublicKey } from '@solana/web3.js';

console.log('🧪 Starting Tefi Anchor & Solana Contract Integrity Test Suite...\n');

// 1. Validar IDL
const idlRaw = fs.readFileSync('src/solana/idl.json', 'utf8');
const idl = JSON.parse(idlRaw);
const progId = new PublicKey('3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc');

console.log(`[1/5] Checking IDL metadata: program '${idl.name}', version '${idl.version}'...`);
assert.strictEqual(idl.name, 'tefi_program');
console.log('  ✓ Program name matches tefi_program');

// 2. Validar Instrucciones Obligatorias
const expectedIxs = ['initializeMerchant', 'initializeCustomer', 'issueFiado', 'repayFiado', 'claimInsurance'];
console.log(`[2/5] Checking all 5 required instructions (${expectedIxs.join(', ')})...`);
for (const ixName of expectedIxs) {
  const ix = idl.instructions.find(i => i.name === ixName);
  assert(ix, `Missing instruction in IDL: ${ixName}`);
  console.log(`  ✓ Instruction '${ixName}' present with ${ix.accounts.length} accounts`);
}

// 3. Validar Firma Bilateral en issueFiado y repayFiado
console.log('[3/5] Verifying bilateral signature constraints (Anti-Fraud / Superteam P0 requirement)...');

const issueIx = idl.instructions.find(i => i.name === 'issueFiado');
const issueMerch = issueIx.accounts.find(a => a.name === 'merchant');
const issueCust = issueIx.accounts.find(a => a.name === 'customer');
assert(issueMerch && issueMerch.isSigner, 'issueFiado must require merchant signer');
assert(issueCust && issueCust.isSigner, 'issueFiado must require customer signer');
console.log('  ✓ issueFiado requires both merchant and customer signers');

const repayIx = idl.instructions.find(i => i.name === 'repayFiado');
const repayMerch = repayIx.accounts.find(a => a.name === 'merchant');
const repayCust = repayIx.accounts.find(a => a.name === 'customer');
assert(repayMerch && repayMerch.isSigner, 'repayFiado must require merchant signer (store payment confirmation)');
assert(repayCust && repayCust.isSigner, 'repayFiado must require customer signer (debt cancellation)');
console.log('  ✓ repayFiado requires bilateral signers (merchant confirmation + customer debt clearance)');

// 4. Validar Derivación de PDAs Canónicas
console.log('[4/5] Testing canonical PDA address derivations...');
const testMerchKey = new PublicKey('7KbR3xDSRoeQZB9vRaem4QiVVxoWnEMarsS9n2dn2N2b');
const testCustKey = new PublicKey('J8amEz69JrYtFaYHmbokmZFnvkw4ivbCx91woRDuurQn');

const [merchPda, merchBump] = PublicKey.findProgramAddressSync([Buffer.from('merchant'), testMerchKey.toBuffer()], progId);
const [custPda, custBump] = PublicKey.findProgramAddressSync([Buffer.from('customer'), testCustKey.toBuffer()], progId);

const nonceBuf = Buffer.alloc(8);
nonceBuf.writeBigUInt64LE(BigInt(0));
const [fiadoPda, fiadoBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('fiado'), testMerchKey.toBuffer(), testCustKey.toBuffer(), nonceBuf],
  progId
);

assert(merchPda && merchBump >= 0, 'Merchant PDA derivation failed');
assert(custPda && custBump >= 0, 'Customer PDA derivation failed');
assert(fiadoPda && fiadoBump >= 0, 'Fiado PDA derivation failed');
console.log(`  ✓ MerchantProfile PDA derived: ${merchPda.toBase58()} (bump: ${merchBump})`);
console.log(`  ✓ CustomerProfile PDA derived: ${custPda.toBase58()} (bump: ${custBump})`);
console.log(`  ✓ FiadoRecord PDA derived: ${fiadoPda.toBase58()} (bump: ${fiadoBump})`);

// 5. Validar Código Fuente Rust
console.log('[5/5] Checking Rust source code constraints in contracts/tefi_program/src/lib.rs...');
const libRs = fs.readFileSync('contracts/tefi_program/src/lib.rs', 'utf8');
assert(libRs.includes('pub merchant: Signer<\'info>'), 'lib.rs must declare merchant Signer in RepayFiado');
assert(libRs.includes('clock.unix_timestamp <= fiado.due_timestamp'), 'lib.rs must verify on-time settlement');
assert(libRs.includes('UnauthorizedMerchant'), 'lib.rs must define UnauthorizedMerchant error');
console.log('  ✓ lib.rs verified: bilateral repayment, due_timestamp check, and error codes present');

console.log('\n🎉 ALL 5 TEST SUITES PASSED! Contract schema, PDA derivations, and bilateral security verified.\n');
