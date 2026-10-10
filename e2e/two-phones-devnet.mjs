// End-to-end run against Solana Devnet with isolated phones (one browser context = one phone, with its own
// storage and therefore its own key). The only thing that goes from one phone to another is the QR code the
// other phone shows: either the app scans it through a simulated camera (a video of that QR, tilted, blurred
// and noisy), or the link it contains is opened, as when it is sent by message. After each step the script
// checks on-chain, outside the app, what was recorded and who signed it.
//
// Usage:  node e2e/two-phones-devnet.mjs <keypair.json holding devnet SOL, used to fund the test stores>
//   TEFI_BASE_URL         where the PWA is served (default http://localhost:4173, the `vite preview` port)
//   TEFI_RPC_URL          node used to verify what was recorded (default: the public devnet node)
//   TEFI_BROWSER_CHANNEL  chrome (default) | msedge | chromium
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { BASE, CAMERA_FEED, SHOTS, check, launch, newDevice, publishedVersion, rpcSummary, setUpPhone, shownVersion } from './devices.mjs';
import { pointCameraAt } from './fake-camera.mjs';

// web3.js, Anchor and the IDL are the ones the PWA itself uses
const require = createRequire(new URL('../package.json', import.meta.url));
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const { BorshAccountsCoder } = require('@coral-xyz/anchor');
const idl = JSON.parse(readFileSync(new URL('../src/solana/idl.json', import.meta.url), 'utf8'));

if (!process.argv[2]) {
  console.error('Usage: node e2e/two-phones-devnet.mjs <funded devnet keypair.json>');
  process.exit(2);
}

const PROGRAM_ID = new PublicKey(idl.metadata.address);
const RPC_URL = process.env.TEFI_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');
const coder = new BorshAccountsCoder(idl);
const funder = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(process.argv[2], 'utf8'))));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const STORE_FUNDING_SOL = 0.03; // rent of the store profile, of its neighbors' profiles and of its fiados, plus fees
const devices = [];
const report = { programId: PROGRAM_ID.toBase58(), rpcUrl: RPC_URL, transactions: [], accounts: {} };

async function retry(fn, attempts = 8) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts) throw err;
      await sleep(1200 * (i + 1));
    }
  }
}

const pda = (...seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const merchantProfilePda = merchant => pda(Buffer.from('merchant'), merchant.toBuffer());
const customerProfilePda = customer => pda(Buffer.from('customer'), customer.toBuffer());

const rawAccount = address => retry(() => connection.getAccountInfo(address));

async function readAccount(name, address) {
  const info = await rawAccount(address);
  return info ? coder.decode(name, info.data) : null;
}

// Every fiado of a neighbor, read the way a lender would (the neighbor key is at byte 40 of FiadoRecord)
async function fiadosOf(customer) {
  const accounts = await retry(() => connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: 166 }, { memcmp: { offset: 40, bytes: customer.toBase58() } }] }));
  return accounts.map(({ pubkey, account }) => ({ address: pubkey, raw: account.data, ...coder.decode('FiadoRecord', account.data) }));
}

async function inspectTransaction(signature) {
  const tx = await retry(async () => {
    const result = await connection.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!result) throw new Error('transaction not available yet');
    return result;
  });
  const keys = tx.transaction.message.getAccountKeys();
  const { numRequiredSignatures } = tx.transaction.message.header;
  return {
    signatures: tx.transaction.signatures.length,
    signers: Array.from({ length: numRequiredSignatures }, (_, i) => keys.get(i).toBase58()),
    feePayer: keys.get(0).toBase58(),
    fee: tx.meta.fee,
    err: tx.meta.err,
    instructions: tx.meta.logMessages.filter(l => l.includes('Instruction:')).map(l => l.replace('Program log: Instruction: ', ''))
  };
}

// A phone's address is read from its storage; the private key never leaves the browser
const deviceAddress = async (device, role) =>
  new PublicKey(
    await device.page.evaluate(r => {
      const secret = JSON.parse(localStorage.getItem(`tefi_keypair_${r}`));
      return secret.slice(32); // the last 32 bytes of the keypair are the public key
    }, role).then(bytes => Uint8Array.from(bytes))
  );

// The QR code a phone is showing: its image, what it says and how dense it is
async function qrOnScreen(device, alt) {
  const image = await device.page.locator(`img[alt="${alt}"]`).getAttribute('src');
  const png = PNG.sync.read(Buffer.from(image.split(',')[1], 'base64'));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!decoded) throw new Error('The QR on screen could not be decoded');
  return { image, text: decoded.data, modules: 17 + 4 * decoded.version };
}

// Compact co-sign requests travel as base32; these two helpers let the run tamper with one
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function fromBase32(text) {
  const bytes = [];
  let bits = 0;
  let value = 0;
  for (const char of text.toUpperCase()) {
    value = ((value << 5) | BASE32.indexOf(char)) & 0xfff;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
function toBase32(bytes) {
  let bits = 0;
  let value = 0;
  let text = '';
  for (const byte of bytes) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      text += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return bits > 0 ? text + BASE32[(value << (5 - bits)) & 31] : text;
}

// Rewrites the amount in pesos a request shows to the neighbor and leaves everything the store signed untouched
function withShownAmount(qrText, amountArs) {
  const url = new URL(qrText);
  const bytes = fromBase32(url.searchParams.get('Q'));
  let offset = 2 + 32 + 4 + 64 + 32; // version and flags, store key, neighbor fingerprint, store signature, blockhash
  const skipVarint = () => {
    while (bytes[offset++] & 0x80);
  };
  skipVarint(); // fiado number
  skipVarint(); // amount in USDC
  skipVarint(); // due date
  offset += 32; // receipt hash
  const start = offset;
  skipVarint(); // amount in pesos shown to the neighbor
  const shown = [];
  for (let rest = amountArs; ; rest >>= 7) {
    shown.push(rest > 0x7f ? (rest & 0x7f) | 0x80 : rest);
    if (rest <= 0x7f) break;
  }
  url.searchParams.set('Q', toBase32(Buffer.concat([bytes.subarray(0, start), Buffer.from(shown), bytes.subarray(offset)])));
  return url.toString();
}

async function fund(address, sol) {
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: address, lamports: Math.round(sol * LAMPORTS_PER_SOL) }));
  await retry(() => sendAndConfirmTransaction(connection, tx, [funder], { commitment: 'confirmed' }));
}

async function openPhone(browser, deviceName) {
  const device = await newDevice(browser, deviceName);
  devices.push(device);
  return device;
}

async function setUpStore(browser, deviceName, storeName) {
  const store = await openPhone(browser, deviceName);
  await setUpPhone(store, 'store', storeName);
  const address = await deviceAddress(store, 'merchant');
  await fund(address, STORE_FUNDING_SOL);
  await store.page.getByRole('button', { name: 'Refresh from chain' }).click();
  return { ...store, address, ownName: storeName };
}

async function setUpNeighbor(browser, deviceName, neighborName) {
  const neighbor = await openPhone(browser, deviceName);
  await setUpPhone(neighbor, 'neighbor', neighborName);
  const address = await deviceAddress(neighbor, 'customer');
  await neighbor.page.getByText('My Tefi QR · show it to a store the first time').click();
  const idQr = await qrOnScreen(neighbor, 'My Tefi QR');
  await neighbor.page.getByRole('button', { name: 'Done' }).click();
  return { ...neighbor, address, idQr, ownName: neighborName };
}

// The store saves the neighbor from their QR: scanning it with its camera, or pasting the link it contains
async function storeAddsNeighbor(store, neighbor, { withCamera = false } = {}) {
  await store.page.locator('nav').getByRole('button', { name: 'Neighbors' }).click();
  if (withCamera) pointCameraAt(neighbor.idQr.image, CAMERA_FEED, { qrSide: 300 });
  await store.page.getByRole('button', { name: 'Add' }).click();
  if (!withCamera) {
    await store.page.getByPlaceholder('...or paste the link here').fill(neighbor.idQr.text);
    await store.page.getByRole('button', { name: 'Open' }).click();
  }
  await store.page.locator('main').getByText(neighbor.ownName).first().waitFor();
}

// The store enters the fiado, signs its part and shows the QR. Returns what that QR says.
async function storeIssuesFiado(store, neighbor, { ars, items }) {
  await store.page.locator('nav').getByRole('button', { name: 'Credit' }).click();
  await store.page.getByText('New Fiado').waitFor();
  await store.page.getByRole('button', { name: new RegExp(neighbor.ownName) }).first().click();
  await store.page.getByPlaceholder('1500').fill(String(ars));
  await store.page.getByPlaceholder('e.g. 1 Milk, 1 Yerba, 500g cheese').fill(items);
  // Receipt photo taken with the phone camera
  await store.page.getByRole('button', { name: 'Open Camera' }).click();
  await store.page.waitForFunction(() => document.querySelector('video')?.videoWidth > 0);
  await store.page.getByRole('button', { name: 'Take Photo' }).click();
  await store.page.getByRole('button', { name: 'Sign & Show QR to the Neighbor' }).click();
  await store.page.getByText('Fiado signed by the store').waitFor({ timeout: 90000 });
  return qrOnScreen(store, 'Tefi co-sign QR');
}

// The store confirms it was paid: it signs its part of the repayment and shows the QR
async function storeRegistersPayment(store) {
  await store.page.locator('nav').getByRole('button', { name: 'Store' }).click();
  await store.page.getByRole('button', { name: 'Register payment' }).first().click();
  await store.page.getByText('Repayment signed by the store').waitFor({ timeout: 90000 });
  return qrOnScreen(store, 'Tefi co-sign QR');
}

const ISSUE = { expectTitle: 'Accept this fiado?', button: 'Sign & accept fiado', doneText: 'Fiado added to your passbook' };
const REPAY = { expectTitle: 'Confirm this repayment?', button: 'Sign & settle fiado', doneText: 'Fiado settled' };

// The neighbor gets the request onto their phone, reviews it and signs with their own key. `qr` is the QR on
// the store's screen: with `camera` the app scans it through the simulated camera (`camera.qrSide` is how many
// pixels of the 1280x720 frame it covers); without it the link inside the QR is opened.
async function neighborSigns(neighbor, qr, { expectTitle, button, doneText }, camera) {
  if (camera) {
    pointCameraAt(qr.image, CAMERA_FEED, camera);
    await neighbor.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  } else {
    await neighbor.page.goto(qr.text);
  }
  await neighbor.page.getByText(expectTitle).waitFor({ timeout: 60000 });
  const reviewText = await neighbor.page.locator('.fixed.inset-0').innerText();
  await neighbor.page.getByRole('button', { name: button }).click();
  await neighbor.page.getByText(doneText).waitFor({ timeout: 120000 });
  const signature = (await neighbor.page.locator('.fixed.inset-0 p.font-mono').innerText()).trim();
  return { reviewText, signature };
}

const closeStoreModal = store => store.page.getByRole('button', { name: 'Done' }).click();

const browser = await launch();
try {
  console.log(`\n== Program ${PROGRAM_ID.toBase58()} · app at ${BASE} · RPC ${RPC_URL} ==`);
  const programInfo = await rawAccount(PROGRAM_ID);
  if (!check(!!programInfo?.executable, 'the program is deployed and executable')) process.exit(1);

  // ------------------------------------------------------------------
  console.log('\n== 1. Two phones, one key on each ==');
  const store = await setUpStore(browser, 'store-1', 'Almacén Don Tito');
  const matias = await setUpNeighbor(browser, 'neighbor-1', 'Matías González');
  report.accounts = {
    store1: store.address.toBase58(),
    neighbor1: matias.address.toBase58(),
    neighbor1Profile: customerProfilePda(matias.address).toBase58()
  };
  const published = await publishedVersion();
  const versions = [store.versionAtFirstUse, matias.versionAtFirstUse, await shownVersion(store), await shownVersion(matias)];
  check(
    versions.every(text => text.includes(`Version ${published.version}`) && text.includes(published.commit.slice(0, 7))),
    `both phones show the version of the app they run, on first use and afterwards (${versions[2]})`
  );
  check(!(await store.storageKeys()).includes('tefi_keypair_customer'), 'the store phone has no neighbor key');
  check(!(await matias.storageKeys()).includes('tefi_keypair_merchant'), 'the neighbor phone has no store key');
  check(matias.idQr.text.includes(matias.address.toBase58()) && !/[?&](cosign|Q)=/i.test(matias.idQr.text), "the neighbor's QR carries only a public key and a name");
  await storeAddsNeighbor(store, matias, { withCamera: true });
  check(true, "the store scanned the neighbor's QR with its camera and saved them under the name typed on the neighbor's phone");

  // ------------------------------------------------------------------
  console.log('\n== 2. Fiado: the store signs, the neighbor completes it from their own phone ==');
  const issueQr = await storeIssuesFiado(store, matias, { ars: 1500, items: 'Yerba 500g + 1 Pan' });
  await store.shot('01-store-issue-qr');
  check(
    issueQr.text.startsWith(`${BASE.toUpperCase()}/?Q=`) && issueQr.modules <= 65,
    `the QR on the store screen is a compact co-sign request (${issueQr.text.length} characters, ${issueQr.modules} modules per side)`
  );
  check((await readAccount('CustomerProfile', customerProfilePda(matias.address))) === null, 'nothing is on-chain before the neighbor signs');

  // The neighbor scans it with the camera: the QR covers 380 of the 720 pixels of the frame height
  const issued = await neighborSigns(matias, issueQr, ISSUE, { qrSide: 380 });
  check(true, "the neighbor's phone read the QR through its camera");
  await matias.shot('02-neighbor-issue-done');
  check(
    issued.reviewText.includes('Yerba 500g + 1 Pan') && issued.reviewText.includes('1,500 ARS') && issued.reviewText.includes('Almacén Don Tito'),
    'the neighbor reviewed store, amount and items before signing'
  );

  const issueTx = await inspectTransaction(issued.signature);
  report.transactions.push({ step: 'issue_fiado (store-1 + neighbor-1)', signature: issued.signature, ...issueTx });
  check(issueTx.err === null && issueTx.signatures === 2, `issue_fiado landed with 2 signatures (${issued.signature})`);
  check(issueTx.signers[0] === store.address.toBase58() && issueTx.signers[1] === matias.address.toBase58(), 'the signers are the store key and the neighbor key');
  check(issueTx.feePayer === store.address.toBase58(), 'the store is the fee payer');
  check(issueTx.instructions.join(',') === 'InitializeCustomer,IssueFiado', `the first fiado also created the neighbor profile (${issueTx.instructions.join(' + ')})`);
  check((await retry(() => connection.getBalance(matias.address))) === 0, 'the neighbor holds 0 SOL');

  const profileAfterIssue = await readAccount('CustomerProfile', customerProfilePda(matias.address));
  const [fiado1] = await fiadosOf(matias.address);
  report.accounts.fiado1 = fiado1.address.toBase58();
  check(
    profileAfterIssue.creditScore === 65 && profileAfterIssue.activeDebtUsdc.toNumber() === fiado1.amountUsdc.toNumber(),
    `neighbor profile on-chain: score 65, debt ${fiado1.amountUsdc.toNumber() / 1e6} USDC`
  );
  check(/^[0-9a-f]{64}$/.test(fiado1.receiptHash), `receipt_hash on-chain is a SHA-256 hex (${fiado1.receiptHash.slice(0, 16)}…)`);

  const storeProfile = await readAccount('MerchantProfile', merchantProfilePda(store.address));
  check(storeProfile.businessName === 'Almacén Don Tito', 'the store profile on-chain carries the name typed on the store phone');
  const profileRaw = (await rawAccount(customerProfilePda(matias.address))).data;
  const leaks = [profileRaw, fiado1.raw].some(data => data.includes(Buffer.from('Matías')) || data.includes(Buffer.from('Yerba')));
  check(!leaks, "neither the neighbor's name nor the purchase details are in the on-chain accounts");

  await store.page.getByText('Fiado recorded on-chain').waitFor({ timeout: 60000 });
  const storeLink = await store.page.locator('.fixed.inset-0 a[href*="explorer.solana.com/tx/"]').getAttribute('href');
  check(storeLink.includes(issued.signature), "the store phone detected the neighbor's signature by itself (same transaction in its explorer link)");
  await store.shot('03-store-issue-confirmed');
  await closeStoreModal(store);

  // ------------------------------------------------------------------
  console.log('\n== 3. Controls: another neighbor, a tampered receipt, a QR used twice ==');
  const carla = await setUpNeighbor(browser, 'neighbor-2', 'Carla Ruiz');
  report.accounts.neighbor2 = carla.address.toBase58();

  // (a) A QR issued for one neighbor is useless on another neighbor's phone
  await carla.page.goto(issueQr.text);
  await carla.page.getByText('This QR was issued for a different neighbor.').waitFor({ timeout: 60000 });
  check(true, "a QR issued for neighbor-1 is rejected on neighbor-2's phone");
  await carla.shot('04-wrong-neighbor-rejected');

  // (b) If someone changes the amount shown in the link, the hash the store signed no longer matches
  await matias.page.goto(withShownAmount(issueQr.text, 150));
  await matias.page.getByText('The receipt in this QR does not match what the store signed. Do not sign it.').waitFor({ timeout: 60000 });
  check(true, 'a tampered receipt is rejected before signing');

  // (c) The same QR cannot be used twice
  await matias.page.goto(issueQr.text);
  await matias.page.getByText('Accept this fiado?').waitFor({ timeout: 60000 });
  await matias.page.getByRole('button', { name: 'Sign & accept fiado' }).click();
  await matias.page.locator('.fixed.inset-0 .text-rose-700').waitFor({ timeout: 90000 });
  const replayError = (await matias.page.locator('.fixed.inset-0 .text-rose-700').innerText()).trim();
  check(/already used|expired/i.test(replayError), `a QR that was already used cannot be signed again ("${replayError}")`);
  check((await fiadosOf(matias.address)).length === 1, 'the replay did not create a second fiado');
  await matias.page.getByRole('button', { name: 'Reject' }).click();

  // ------------------------------------------------------------------
  console.log('\n== 4. Repayment: the store confirms it was paid, the neighbor co-signs ==');
  await store.page.locator('nav').getByRole('button', { name: 'Store' }).click();
  await store.page.getByRole('button', { name: 'Register payment' }).first().waitFor({ timeout: 60000 });
  await store.shot('05-store-dashboard-active');
  const repayQr = await storeRegistersPayment(store);
  await store.shot('06-store-repay-qr');

  // Scanned from further away: the repayment QR is smaller and covers 300 pixels of the frame
  const repaid = await neighborSigns(matias, repayQr, REPAY, { qrSide: 300 });
  await matias.shot('07-neighbor-repay-done');
  const repayTx = await inspectTransaction(repaid.signature);
  report.transactions.push({ step: 'repay_fiado (store-1 + neighbor-1)', signature: repaid.signature, ...repayTx });
  check(repayTx.err === null && repayTx.signatures === 2 && repayTx.instructions.join(',') === 'RepayFiado', `repay_fiado landed with 2 signatures (${repaid.signature})`);
  check(repayTx.signers[0] === store.address.toBase58() && repayTx.signers[1] === matias.address.toBase58(), 'the repayment signers are the store key and the neighbor key');

  const profileAfterRepay = await readAccount('CustomerProfile', customerProfilePda(matias.address));
  check(
    profileAfterRepay.creditScore === 70 && profileAfterRepay.creditLimitUsdc.toNumber() === 55_000_000 && profileAfterRepay.activeDebtUsdc.toNumber() === 0,
    'on-chain profile after the on-time repayment: score 70, limit 55 USDC, debt 0'
  );
  check((await readAccount('FiadoRecord', fiado1.address)).status === 2, 'the FiadoRecord is PAID on-chain');
  check((await retry(() => connection.getBalance(matias.address))) === 0, 'the neighbor still holds 0 SOL after two signed transactions');

  await store.page.getByText('Repayment recorded on-chain').waitFor({ timeout: 60000 });
  await store.shot('08-store-repay-confirmed');
  await closeStoreModal(store);

  // ------------------------------------------------------------------
  console.log('\n== 5. What the screens show comes from the chain ==');
  await matias.page.getByRole('button', { name: 'Back to my passbook' }).click();
  await matias.page.locator('nav').getByRole('button', { name: 'Credit Score' }).click();
  await matias.page.getByText('On-Chain Credit Score').waitFor();
  await matias.page.getByText('55.00 USDC').first().waitFor({ timeout: 30000 });
  check(/\b70\b/.test(await matias.page.locator('main').innerText()), 'the neighbor phone shows score 70 and a 55 USDC limit');
  await matias.shot('09-neighbor-score');
  await matias.page.locator('nav').getByRole('button', { name: 'History' }).click();
  await matias.page.getByText('Settled fiados (1)').waitFor({ timeout: 30000 });
  check(true, 'the neighbor history lists the settled fiado');
  await matias.shot('10-neighbor-history');

  // ------------------------------------------------------------------
  console.log('\n== 6. Portable history: a second store, on another phone, gives credit to the same neighbor ==');
  const store2 = await setUpStore(browser, 'store-2', 'Despensa La Esquina');
  report.accounts.store2 = store2.address.toBase58();
  check(store2.address.toBase58() !== store.address.toBase58(), 'store-2 is a different device with a different key');
  await storeAddsNeighbor(store2, matias);
  await store2.page.getByText('Score: 70 pts').waitFor({ timeout: 30000 });
  check(true, 'store-2 reads the score built at store-1 (70) straight from the neighbor profile account');
  await store2.shot('11-store2-reads-portable-score');

  const secondQr = await storeIssuesFiado(store2, matias, { ars: 2400, items: '1 Aceite + 1 Azúcar' });
  const issued2 = await neighborSigns(matias, secondQr, ISSUE);
  const issueTx2 = await inspectTransaction(issued2.signature);
  report.transactions.push({ step: 'issue_fiado (store-2 + neighbor-1)', signature: issued2.signature, ...issueTx2 });
  check(
    issueTx2.err === null && issueTx2.signatures === 2 && issueTx2.instructions.join(',') === 'IssueFiado',
    `the store-2 fiado landed with 2 signatures and needed no profile setup (${issued2.signature})`
  );
  check(issueTx2.feePayer === store2.address.toBase58(), 'store-2 paid the fee of its own fiado');
  await store2.page.getByText('Fiado recorded on-chain').waitFor({ timeout: 60000 });
  await closeStoreModal(store2);

  await matias.page.getByRole('button', { name: 'Back to my passbook' }).click();
  await matias.page.getByText('Active Store Credits (1)').waitFor({ timeout: 30000 });
  check((await matias.page.locator('main').innerText()).includes('Despensa La Esquina'), "the neighbor's passbook shows the fiado under the name of store-2");
  await matias.shot('12-neighbor-passbook-second-store');

  // ------------------------------------------------------------------
  console.log('\n== 7. Two counters at the same time ==');
  // While store-2 collects from Matías, store-1 gives Carla her first fiado
  await storeAddsNeighbor(store, carla);
  const [carlaIssue, matiasRepay] = await Promise.all([
    storeIssuesFiado(store, carla, { ars: 3200, items: '1 Queso + 1 Dulce de leche' }).then(qr => neighborSigns(carla, qr, ISSUE)),
    storeRegistersPayment(store2).then(qr => neighborSigns(matias, qr, REPAY))
  ]);
  const [carlaTx, matiasTx] = await Promise.all([inspectTransaction(carlaIssue.signature), inspectTransaction(matiasRepay.signature)]);
  report.transactions.push({ step: 'issue_fiado (store-1 + neighbor-2), concurrent', signature: carlaIssue.signature, ...carlaTx });
  report.transactions.push({ step: 'repay_fiado (store-2 + neighbor-1), concurrent', signature: matiasRepay.signature, ...matiasTx });
  check(
    carlaTx.err === null && carlaTx.signatures === 2 && carlaTx.signers.join() === [store.address, carla.address].map(k => k.toBase58()).join(),
    `store-1 + neighbor-2 fiado landed with their 2 signatures (${carlaIssue.signature})`
  );
  check(
    matiasTx.err === null && matiasTx.signatures === 2 && matiasTx.signers.join() === [store2.address, matias.address].map(k => k.toBase58()).join(),
    `store-2 + neighbor-1 repayment landed with their 2 signatures (${matiasRepay.signature})`
  );
  check(carlaIssue.reviewText.includes('Almacén Don Tito') && matiasRepay.reviewText.includes('Despensa La Esquina'), 'each neighbor saw the name of the store they were signing with');

  const carlaProfile = await readAccount('CustomerProfile', customerProfilePda(carla.address));
  const matiasProfile = await readAccount('CustomerProfile', customerProfilePda(matias.address));
  report.accounts.neighbor2Profile = customerProfilePda(carla.address).toBase58();
  check(carlaProfile.creditScore === 65 && carlaProfile.activeDebtUsdc.toNumber() > 0, `neighbor-2 profile on-chain: score 65, debt ${carlaProfile.activeDebtUsdc.toNumber() / 1e6} USDC`);
  check(
    matiasProfile.creditScore === 75 && matiasProfile.creditLimitUsdc.toNumber() === 60_000_000 && matiasProfile.activeDebtUsdc.toNumber() === 0,
    'neighbor-1 profile after a second on-time repayment, at another store: score 75, limit 60 USDC, debt 0'
  );
  await store.page.getByText('Fiado recorded on-chain').waitFor({ timeout: 60000 });
  await store2.page.getByText('Repayment recorded on-chain').waitFor({ timeout: 60000 });
  check(true, 'both store phones detected their own transaction');
  await store.shot('13-store1-concurrent-issue-confirmed');
  await store2.shot('14-store2-concurrent-repay-confirmed');

  console.log('');
  for (const device of devices) {
    // The rejections this run provokes on purpose (other neighbor, tampered receipt, reused QR) are logged to the console
    const unexpected = device.errors.filter(e => !/429|Failed to load resource|CosignError|already been processed/.test(e));
    check(unexpected.length === 0, `${device.name}: no unexpected console errors`);
    unexpected.slice(0, 5).forEach(e => console.log('   ', e));
  }
} catch (err) {
  console.log('\nERROR:', err.message.split('\n').slice(0, 6).join('\n'));
  process.exitCode = 1;
  // What each phone was showing when the run failed
  for (const device of devices) {
    await device.shot(`fail-${device.name}`).catch(() => {});
    console.log(`--- ${device.name} ---\n${(await device.page.locator('body').innerText().catch(() => '')).slice(0, 600)}`);
  }
} finally {
  report.rpc = rpcSummary(devices);
  console.log('\nRPC traffic of the phones:', JSON.stringify(report.rpc));
  writeFileSync(path.join(SHOTS, 'report.json'), JSON.stringify(report, null, 2));
  console.log('Report and screenshots:', SHOTS);
  await browser.close();
}
