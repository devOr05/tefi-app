# 🛒 Tefi.app — Digital Neighborhood Credit Ledger on Solana

> **Turning informal corner store credit ("el fiado") into a verifiable, portable on-chain repayment history, co-signed by store and neighbor.**  
> Built for the **Colosseum Crypto World's Fair Hackathon** & **Superteam Argentina Track**.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.29.0-50E3C2?style=flat)](https://anchor-lang.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-00A650?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Live Demo](https://img.shields.io/badge/Live%20App-tef--iapp.vercel.app-blue)](https://tef-iapp.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

* 🌐 **Live Demo Web PWA**: [https://tef-iapp.vercel.app](https://tef-iapp.vercel.app/)
* 📦 **Solana Devnet Program**: [`9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ`](https://explorer.solana.com/address/9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ?cluster=devnet)

---

## 📌 Problem & Local Insight

In Argentina and throughout Latin America, corner grocery stores (*almacenes de barrio*) sell on **"el fiado"**: informal credit written in a paper notebook.

1. **The Merchant's Dilemma**: Merchants issue credit in Argentine Pesos and collect weeks later. In a high-inflation economy, delayed cash repayments erode the store's working capital.
2. **The Neighbor's Invisibility**: Customers repay their neighborhood debts faithfully for years, yet that repayment history is invisible to the formal financial system and cannot be shown to any lender.
3. **The Core Insight**: The corner store is already the neighborhood's first credit originator. What is missing is not credit itself, but a **record of the repayment, signed by both parties, that the neighbor can take anywhere**.

---

## ⚡ The Solution: Tefi.app

**Tefi** is a mobile-first Progressive Web App (PWA) that replaces the paper notebook with a ledger on **Solana** where every fiado and every repayment is a transaction signed by **both** the store and the neighbor, each from their own phone.

* 📱 **One phone, one role, one key**: On first use a phone is set up either as the **Store** (*Almacén*) or as a **Neighbor** (*Vecino*) and creates only that role's signing key.
* 🧾 **Co-signed credit issuance**: The merchant enters the amount in ARS (converted to USDC with the `dolarapi.com` exchange rate), takes a photo of the receipt and **signs first**. The partially signed transaction is shown as a QR code. The neighbor scans it with their own phone, reviews what the transaction says, adds the second signature and submits it.
* 🤝 **Co-signed repayment**: When the neighbor pays (cash or transfer, as today), the store confirms it by signing `repay_fiado`; the neighbor co-signs the same way. Neither party can record or settle a debt alone.
* ⛽ **The neighbor needs no SOL**: The store is the fee payer of every transaction and pays the rent of the accounts, including the neighbor's profile in their first fiado.
* 📈 **Portable repayment history**: Each on-time repayment raises the neighbor's on-chain score (+5) and credit limit (+5 USDC). Score, limit, debt and repaid total live in an account that any lender can read without asking Tefi.

Tefi records the debt and its repayment; the money itself keeps moving off-chain between neighbor and store. Amounts are stored in USDC units as a stable unit of account, not as token transfers.

---

## 🔏 How the Two-Phone Co-Signature Works

```
 STORE PHONE (holds only the store key)            NEIGHBOR PHONE (holds only the neighbor key)
 ──────────────────────────────────────            ────────────────────────────────────────────
                                                    0. Shows "My Tefi QR": public key only
 1. Scans it once: neighbor saved in the store's list
 2. Builds issue_fiado, feePayer = store
 3. tx.partialSign(storeKey)
 4. Serializes with requireAllSignatures: false
    and shows it as a QR / link  ───────────────►  5. Deserializes the transaction
                                                    6. Verifies the store signature and rejects anything
                                                       that is not exactly a Tefi fiado/repayment for
                                                       its own key (no hidden instructions)
                                                    7. Checks that the receipt shown matches the
                                                       receipt_hash the store signed
                                                    8. tx.partialSign(neighborKey) and sends it
 9. Follows the transaction by its own signature
    and shows it on Solana Explorer  ◄───────────  9. Shows the transaction on Solana Explorer
```

* The only thing that travels between the phones is the content of the QR code. Implementation: [`src/solana/cosign.ts`](src/solana/cosign.ts).
* A QR is valid for about a minute (Solana blockhash lifetime). The store phone re-signs it with a fresh blockhash before it expires. A signed request cannot be replayed: each fiado account is derived from a per-store nonce, and a settled fiado cannot be repaid again.
* **Single-device demo**: the role switch lets one browser act as both store and neighbor so the flow can be tried on a single device. In that case both keys live in the same browser and the app shows a permanent *"Single-device demo: both keys are on this device"* label. The transactions are still real two-signature transactions; what is lost is the separation between devices.

---

## 🛠️ Verified Tech Stack

| Layer | Technology | Status & Purpose |
| :--- | :--- | :--- |
| **Blockchain L1** | **Solana Devnet** (`api.devnet.solana.com`) | Low fees and fast confirmation make co-signing a US$2–4 purchase at the counter viable. |
| **Smart Contract** | **Anchor Framework (Rust) v0.29.0** | PDAs for stores, neighbors and fiados. 14 integration tests against `solana-test-validator` in CI. |
| **Web3 Client SDK** | **`@solana/web3.js` 1.x & `@coral-xyz/anchor` 0.29** | Instruction building from the IDL, partial signing, transaction (de)serialization and account decoding. |
| **Co-signature transport** | **`qrcode` & `html5-qrcode`** | The partially signed transaction travels from the store phone to the neighbor phone as a QR code or link. |
| **Fee sponsorship** | **Store as fee payer** | The store pays the network fee and account rent of every fiado and repayment, so neighbors never need SOL. |
| **Frontend / PWA** | **React 18, TypeScript, Tailwind CSS, Vite** | Mobile-first Progressive Web App (PWA) with precached assets. |
| **Exchange rate** | **`dolarapi.com` REST API** | Argentine Peso (ARS) to USD crypto rate, with a fixed reference rate as offline fallback. It is an off-chain REST feed, not an on-chain oracle. |

Not part of this build (see the Roadmap below): attestations, embedded wallets, payment rails, insurance or savings products, on-chain price oracles and decentralized identity.

---

## 💡 Why Solana?

Daily grocery purchases of **US$1.50 to US$10** (bread, milk, deli items) cannot carry a meaningful per-transaction cost:
* **Low fees**: Recording and co-signing a fiado costs a fraction of a cent in network fees, so the store can sponsor it.
* **Fast confirmation**: The fiado is confirmed while both people are still at the counter.
* **Readable by anyone**: The neighbor's history lives in program accounts that any lender or protocol can read over RPC, and it can later be exposed through a standard such as the Solana Attestation Service.

---

## 💼 Business Model (Hypothesis)

* **Free for Corner Stores & Neighbors**: The digital ledger is free for merchants and consumers.
* **Who would pay**: Lenders that already serve this segment (mutuals, credit cooperatives, microcredit fintechs) would pay an **origination fee (1–2%)** on loans granted to neighbors with a Tefi history, or a **query fee (US$0.50–1.00)** per verified history.

This is a hypothesis: it has not been validated with a paying lender yet. Validating it is one of the goals of the pilot.

---

## 🏛️ Smart Contract Architecture (Anchor)

The Anchor program ([`contracts/tefi_program/programs/tefi_program/src/lib.rs`](contracts/tefi_program/programs/tefi_program/src/lib.rs)) enforces bilateral agreements through Program Derived Addresses (PDAs):

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Solana Devnet State                           │
├────────────────────────────────┬───────────────────────────────────────┤
│ Merchant Profile PDA           │ Customer Profile PDA                  │
│ seeds = ["merchant", pubkey]   │ seeds = ["customer", pubkey]          │
│ • Business name & category     │ • On-chain Credit Score (0-100)       │
│ • Total sales & default stats  │ • Credit limit (USDC units)           │
│ • Sequential fiado nonce       │ • Active debt & total repaid          │
├────────────────────────────────┴───────────────────────────────────────┤
│ Fiado Record PDA                                                       │
│ seeds = ["fiado", merchant_pubkey, customer_pubkey, nonce]             │
│ • Amount (USDC units), due date, status (Active / Paid)                │
│ • receipt_hash: SHA-256 of the receipt, never the purchase details     │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Instructions

| Instruction | Required signers | Who pays fee & rent | What it does |
| :--- | :--- | :--- | :--- |
| `initialize_merchant` | Store | Store | Creates the store profile PDA. |
| `initialize_customer` | Payer (store) + Neighbor | Store | Creates the neighbor profile PDA (score 65, limit 50 USDC). Sent in the same transaction as the neighbor's first fiado. |
| `issue_fiado` | **Store + Neighbor** | Store | Creates the fiado PDA and adds the debt, within the neighbor's on-chain limit. Rejects any `receipt_hash` that is not a 64-character hex SHA-256. |
| `repay_fiado` | **Store + Neighbor** | Store | Marks the fiado as paid. If repaid on or before the due date: score +5 (max 100) and limit +5 USDC. |
| `claim_insurance` | Store | Store | Program-level default marking after a mandatory 30-day grace period (lowers the neighbor's score). Not exposed in the PWA: there is no insurance fund. |

### 🔗 Live Solana Devnet Transactions

> **Deployment pending.** The program id above is new: the 06/10 deployment (`3bs3SLqe…`) does not include the bilateral `repay_fiado` and cannot be upgraded. The co-signed `issue_fiado` and `repay_fiado` transactions of the new deployment are listed here as soon as it is live.

### 🔍 How Any Third-Party Lender Reads a Neighbor's History On-Chain

A lender only needs the neighbor's public key and an RPC endpoint. No Tefi server is involved:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor';
import idl from './src/solana/idl.json';

const PROGRAM_ID = new PublicKey('9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const coder = new BorshAccountsCoder(idl as Idl);

const neighbor = new PublicKey('<neighbor public key>');
const [profilePda] = PublicKey.findProgramAddressSync([Buffer.from('customer'), neighbor.toBuffer()], PROGRAM_ID);

// Credit profile: one account per neighbor
const profile = coder.decode('CustomerProfile', (await connection.getAccountInfo(profilePda))!.data);
console.log('Credit score:', profile.creditScore); // 0-100
console.log('Credit limit (USDC):', profile.creditLimitUsdc.toNumber() / 1_000_000);
console.log('Active debt (USDC):', profile.activeDebtUsdc.toNumber() / 1_000_000);
console.log('Repaid to date (USDC):', profile.totalRepaidUsdc.toNumber() / 1_000_000);

// Every fiado of that neighbor, across all stores (customer is at byte offset 40 of FiadoRecord)
const fiados = await connection.getProgramAccounts(PROGRAM_ID, {
  filters: [{ memcmp: { offset: 40, bytes: neighbor.toBase58() } }]
});
for (const { account } of fiados) {
  const fiado = coder.decode('FiadoRecord', account.data);
  console.log(fiado.merchant.toBase58(), fiado.amountUsdc.toNumber() / 1_000_000, fiado.status === 2 ? 'PAID' : 'ACTIVE');
}
```

The same read is available as a script: `npm run read:history -- <neighbor public key>` ([`scripts/read-neighbor-history.mjs`](scripts/read-neighbor-history.mjs)).

---

## 🔒 Privacy & Security

* **On-chain**: pseudonymous public keys, amounts, due dates, status and the SHA-256 of each receipt. The store's business name is public in its profile.
* **Only on the phones**: the neighbor's name, the purchase details and the receipt photo. The program rejects a readable text in `receipt_hash`.
* **What the neighbor signs is what the transaction says**: the neighbor's phone decodes the transaction, shows its amount and due date, and refuses anything other than a Tefi fiado or repayment addressed to its own key.
* **Devnet prototype**: signing keys are generated in the browser and kept in `localStorage`. This is acceptable for devnet and **not** for a pilot with real neighbors or real money; moving keys to an embedded wallet is on the roadmap. Clearing the browser data loses the key (the on-chain history stays, but can no longer be extended).

---

## 📊 Field Validation in Mar del Plata
* **12 Corner Store Interviews conducted** across working-class neighborhoods in Mar del Plata, Argentina.
* **4 Stores actively committed** to join the 30-day pilot trial.
* **Key Learning**: Average grocery credit ticket is $2.00 - $4.00 USD (bread, milk, deli items) settled on weekly wage days. Over 90% of stores use physical paper notebooks with zero inflation hedge and zero credit portability for neighbors.

---

## 🧪 Tests

| Command | What it runs | Tests |
| :--- | :--- | :---: |
| `npm test` | Vitest suites that import the real modules: the co-signature protocol ([`cosign.test.ts`](src/solana/cosign.test.ts)), instruction building and account decoding ([`program.test.ts`](src/solana/program.test.ts)), the debt ledger ([`financialLedger.test.ts`](src/services/financialLedger.test.ts)) and the passbook view ([`libreta.test.ts`](src/services/libreta.test.ts)). | 46 |
| `anchor test` (CI) | Mocha tests against the compiled program on `solana-test-validator`: both signatures required, credit limit, double repayment, unauthorized store, grace period, hashed receipts and a two-device partial-signing round trip with a 0 SOL neighbor ([`tefi_program.ts`](contracts/tefi_program/tests/tefi_program.ts)). | 14 |

Both run in GitHub Actions: [`.github/workflows/anchor.yml`](.github/workflows/anchor.yml) (PWA build + `npm test`) and [`.github/workflows/contract-ci.yml`](.github/workflows/contract-ci.yml) (SBF build + Anchor tests).

---

## 🗺️ Roadmap

The app only shows what runs on-chain today. Everything below is **not built yet**:

* [x] **Core MVP (live on Devnet)**: two-phone co-signed credit issuance and repayment with the store as fee payer, hashed receipts, on-chain score and limit, passbook read from chain, English & Spanish UI.
* [ ] **30-day pilot** with the committed stores, measuring fiados recorded and on-time repayment rate.
* [ ] **Solana Attestation Service (SAS)**: a standard attestation per on-time repayment, readable by lenders that do not know the Tefi program.
* [ ] **Embedded wallets**: keys out of browser storage and account recovery before any pilot with real neighbors.
* [ ] **Solana Actions & Blinks**: repayment links over WhatsApp.
* [ ] **Mutual guarantee fund for stores**, only together with a regulated partner.

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js 20+ & npm
* Modern web browser with camera access (for the QR flows)

### Installation
```bash
# Clone the repository
git clone https://github.com/devOr05/tefi-app.git
cd tefi-app

# Install dependencies
npm install

# Start development server
npm run dev

# Run the tests
npm test
```

### Try the flow
1. **Store phone**: open the app, choose *I'm the store* and request devnet SOL (the *+1 SOL* button, or [faucet.solana.com](https://faucet.solana.com/) with the store address).
2. **Neighbor phone**: open the app, choose *I'm a neighbor* and tap *My Tefi QR*.
3. **Store phone**: *Neighbors → Add* and scan the neighbor's QR. Then *Credit*: amount, items, photo, *Sign & Show QR to the Neighbor*.
4. **Neighbor phone**: *Scan QR*, review and *Sign & accept fiado*. Both phones link to the transaction on Solana Explorer.
5. **Repayment**: on the store phone tap *Register payment* on the fiado and let the neighbor scan the new QR.

With a single device, use the *Store / Neighbor* switch in the header: the app labels it as a single-device demo.

### Production Build
```bash
npm run build
```

### Deploying the program
The program id is declared in `lib.rs`, `Anchor.toml` and `src/solana/program.ts` (CI checks that they match). The SBF binary is built by the *Anchor Contract Compilation & Localnet Tests* workflow and published as the `tefi_program-sbf` artifact.

```bash
solana program deploy tefi_program.so --program-id <program keypair or id> --keypair <upgrade authority keypair> --url devnet
```

Keep the upgrade authority keypair outside the repository.

---

## 👥 Team

* **Mario Orostizaga** — Founder & Full-Stack Developer  
  * Location: Mar del Plata, Argentina  
  * GitHub: [@devOr05](https://github.com/devOr05)  
  * LinkedIn: [Mario Orostizaga](https://www.linkedin.com/in/mario-orostizaga)  
  * Focus: Grassroots merchant interviews, smart contracts, and mobile retail UX.
