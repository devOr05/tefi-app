# 🛒 Tefi.app — Digital Neighborhood Credit Ledger on Solana

> **Turning informal corner store credit ("el fiado") into a verifiable, portable on-chain credit history.**  
> Built for the **Colosseum Crypto World's Fair Hackathon** & **Superteam Argentina Track**.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-50E3C2?style=flat)](https://anchor-lang.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-00A650?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Live Demo](https://img.shields.io/badge/Live%20App-tef--iapp.vercel.app-blue)](https://tef-iapp.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

* 🌐 **Live Demo Web PWA**: [https://tef-iapp.vercel.app](https://tef-iapp.vercel.app/)
* 📦 **Solana Devnet Program**: [`3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc`](https://explorer.solana.com/address/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet)

---

## 📌 Problem & Local Insight

In Argentina and throughout Latin America, corner grocery stores (*almacenes de barrio*) are the primary financial lifeline for millions of working-class families. Over **70% of local grocery purchases** depend on **"el fiado"** — informal ledger credit written in paper notebooks.

1. **The Merchant's Dilemma**: Merchants issue credit in Argentine Pesos and collect weeks later. In high-inflation economies, delayed cash repayments erode store working capital.
2. **The Neighbor's Invisibility**: Working-class customers repay their neighborhood debts faithfully for 5 to 10 years, yet remain **100% invisible to the formal financial system**. They have zero credit score and are excluded from formal microloans.
3. **The Core Insight**: The corner store is already the neighborhood's premier credit originator. What is missing is not credit itself, but an **immutable, portable on-chain track record of that repayment trust** that the neighbor can take anywhere.

---

## ⚡ The Solution: Tefi.app

**Tefi** digitizes informal counter credit on **Solana** through a frictionless, mobile-first Progressive Web App (PWA):

* 📱 **Dual-Role Counter UX**: Instantly switch between **Store Mode** (*Almacén*) and **Neighbor Mode** (*Vecino*).
* 🧾 **Bilateral QR Credit Issuance**: The merchant inputs the grocery amount in ARS (converted to USDC via live oracle), snaps a receipt photo, and generates a dynamic QR code. The customer scans the QR to sign and consent to the credit.
* 🔗 **Load-Bearing On-Chain Settlement**: Credit issuance and repayments invoke our Anchor smart contract on Solana Devnet, linking the counter transaction to cryptographic keypairs.
* 📈 **Portable Credit Score**: Each on-time settlement boosts the customer's on-chain score (+5 points) and expands their counter credit limit, creating an immutable history readable by third-party lenders.

---

## 💡 Why Solana?

Traditional finance and layer-1 blockchains like Ethereum cannot service **$1.50 to $10.00 USD daily grocery purchases** (bread, milk, deli items):
* **Sub-Cent Fees (<$0.001)**: Allows microcredit settlements without network gas eating the merchant's margin.
* **400ms Sub-Second Finality**: Essential for real-world retail checkout speed at the counter.
* **Composability**: Allows future credit attestations via standard protocols (e.g. Solana Attestation Service) for third-party microfinance integration.

---

## 💼 Business Model: Who Pays and How Tefi Earns

* **100% Free for Corner Stores & Neighbors**: The digital ledger is completely free for merchants and consumers, maximizing grassroots neighborhood adoption.
* **Monetization (Lenders & Fintechs)**: Microfinance institutions and fintechs pay an **API query fee ($0.50 - $1.00 USD)** to inspect verified on-chain credit histories, or an **origination fee (1-2%)** on microloans successfully underwritten using Tefi's verified track records.

---

## 🏛️ Smart Contract Architecture (Anchor)

The Anchor program (`contracts/tefi_program/src/lib.rs`) enforces bilateral counter agreements and non-custodial accounting through Program Derived Addresses (PDAs):

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Solana Devnet State                           │
├────────────────────────────────┬───────────────────────────────────────┤
│ Merchant Profile PDA           │ Customer Profile PDA                  │
│ seeds = ["merchant", pubkey]   │ seeds = ["customer", pubkey]          │
│ • Business name & category     │ • On-chain Credit Score (0-100)       │
│ • Total sales & default stats  │ • Available credit limit (USDC)       │
│ • Sequential fiado nonce       │ • Active debt & total repaid          │
├────────────────────────────────┴───────────────────────────────────────┤
│ Fiado Record PDA                                                       │
│ seeds = ["fiado", merchant_pubkey, customer_pubkey, nonce]             │
│ • Bilateral Signers: Both Merchant AND Customer must sign on-chain    │
│ • Amount (USDC), due date timestamp, receipt hash, status (Active/Paid)│
└────────────────────────────────────────────────────────────────────────┘
```

### Core Instructions:
1. `initialize_merchant`: Initializes store profile PDA with baseline risk parameters.
2. `initialize_customer`: Initializes neighbor profile PDA with trust baseline credit.
3. `issue_fiado`: Creates a new store credit PDA requiring **both merchant and customer signatures**.
4. `repay_fiado`: Settle debt, updates customer on-chain score (+5), and raises credit limit.
5. `claim_insurance`: Actuarial default recovery with mandatory 30-day grace period enforcement.

### 🔗 Live Solana Devnet Verified Transactions & State

| Operation / Instruction | Signers | Devnet Transaction Hash / Account | Verified On-Chain State |
| :--- | :--- | :--- | :--- |
| **Program Deployment** | Deployer | [`5nx39Tk5k9jC...`](https://explorer.solana.com/tx/5nx39Tk5k9jCjee1tRr3yW7jMSyLXRxMwZVmDYUCZuTKPzRpgMyHdPAdhzGqaPqb2vuYVhHy61WAB9vc7xLeNCdc?cluster=devnet) | Program Executable on Devnet |
| **`initialize_merchant`** | Merchant | [`22TwQz1wgrzo...`](https://explorer.solana.com/tx/22TwQz1wgrzoRcKqik8zrirg12e2menvnKFt3jsSr7wwdxEX59rYLon7YgzzVVJLgdRiGfh27yrBxZgtQaihTgCT?cluster=devnet) | Merchant PDA created (`53DzLq...`) |
| **`initialize_customer`** | Customer | [`36aArF4bZSY6...`](https://explorer.solana.com/tx/36aArF4bZSY6dVnvwB6LRuufgVcFoZRdMHA8dHzC4Vdiwi5RA6SbAr7v8TNtxqivSd6re2KSQR3hYicVTmDhhBsC?cluster=devnet) | Base Score: 65, Base Limit: $50 USDC |
| **`issue_fiado`** | **Bilateral** (Store + Neighbor) | [`3xpfrYgdHyGo...`](https://explorer.solana.com/tx/3xpfrYgdHyGoBkZHWBBN5jGo6LgcWwJhbPmj7pFTNnRXseRb6HBMWSLsQmM9wwnWKt2dei6Yaid6AhYJawyRHwGD?cluster=devnet) | Fiado PDA created, Active Debt: $0.93 USDC |
| **`repay_fiado`** | **Bilateral** (Store confirms + Neighbor) | [`2QJs5Uqa81zU...`](https://explorer.solana.com/tx/2QJs5Uqa81zUJEjQLP3t8ArYML65Vr3yCG97qVVYi4L19B5Jnkuob5ioGcGyGEJsyaeX8E6c3rHsgRAM8wZKmEd6?cluster=devnet) | Debt: $0.00, Score: +5 (70 pts), Limit: +$5 ($55 USDC) |
| **Customer Profile PDA** | - | [`xoQGyQRAVmK5...`](https://explorer.solana.com/address/xoQGyQRAVmK5tWRoMF1UaFr5E53p2qMLTMVAY9dCDeK?cluster=devnet) | **Score: 70/100 · Limit: $55.00 · Repaid: $0.93** |

* **Program ID**: [`3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc`](https://explorer.solana.com/address/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet)
* **Solscan Devnet**: [https://solscan.io/account/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet](https://solscan.io/account/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet)

### 🔍 How Any Third-Party Lender Reads Customer Credit History On-Chain
Any microfinance institution, bank, or fintech can inspect a neighbor's credit track record directly via Solana RPC or Anchor without relying on Tefi's private servers:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from './idl.json';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const [customerPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('customer'), customerWalletPublicKey.toBuffer()],
  new PublicKey('3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc')
);

// Fetch verifiable on-chain credit parameters directly from the PDA
const profile = await program.account.customerProfile.fetch(customerPda);
console.log('Verified Credit Score:', profile.creditScore); // e.g. 70 / 100
console.log('Approved Credit Limit (USDC):', profile.creditLimitUsdc.toNumber() / 1_000_000);
console.log('Historical Repaid Total (USDC):', profile.totalRepaidUsdc.toNumber() / 1_000_000);
```

---

## 📊 Field Validation in Mar del Plata
* **12 Corner Store Interviews conducted** across working-class neighborhoods in Mar del Plata, Argentina.
* **4 Stores actively committed** to join the 30-day pilot trial.
* **Key Learning**: Average grocery credit ticket is $2.00 - $4.00 USD (bread, milk, deli items) settled on weekly wage days. Over 90% of stores use physical paper notebooks with zero inflation hedge and zero credit portability for neighbors.

---

## 🗺️ Roadmap & Prototypes

To maintain focused execution during the hackathon, advanced modules are explicitly scoped as roadmap milestones:

* [x] **Core MVP (Live on Devnet)**: Bilateral QR credit issuance, receipt photo capture, real Devnet transaction broadcasting, on-chain credit scoring, English & Spanish bilingual UI.
* [ ] **Q4 2026 — Solana Attestation Service (SAS)**: Emitting standard on-chain credit attestations upon each `repay_fiado` for third-party fintech queries.
* [ ] **Q1 2027 — Decentralized Actuarial Insurance Vault**: Mutual pool PDA with dynamic risk-adjusted premiums (2.5% to 12%) protecting stores against defaults.
* [ ] **Q1 2027 — Solana Actions & Blinks**: WhatsApp settlement links enabling customers to repay counter credit with a single tap.
* [ ] **Q2 2027 — Embedded Wallets (Privy / Solana Mobile)**: Seamless biometric onboarding abstracting seed phrases completely.

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js 18+ & npm
* Modern web browser with camera access (for QR counter flows)

### Installation
```bash
# Clone the repository
git clone https://github.com/devOr05/tefi-app.git
cd tefi-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 👥 Team

* **Mario Orostizaga** — Founder & Full-Stack Developer  
  * Location: Mar del Plata, Argentina  
  * GitHub: [@devOr05](https://github.com/devOr05)  
  * LinkedIn: [Mario Orostizaga](https://www.linkedin.com/in/mario-orostizaga)  
  * Focus: Grassroots merchant interviews, smart contracts, and mobile retail UX.
