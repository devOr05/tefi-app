# 🛒 Tefi.app — Digital Neighborhood Credit Ledger on Solana

> **Turning informal corner store credit ("el fiado") into a verifiable, portable on-chain credit history.**  
> Built for the **Colosseum Crypto World's Fair Hackathon** & **Superteam Argentina Track**.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-50E3C2?style=flat)](https://anchor-lang.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-00A650?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

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
* 🔗 **Load-Bearing On-Chain Settlement**: Credit issuance and repayments are broadcast to Solana Devnet, linking the counter transaction to cryptographic keypairs.
* 📈 **Portable Credit Score**: Each on-time settlement boosts the customer's on-chain score (+5 points) and expands their counter credit limit, creating an immutable history readable by third-party lenders.

---

## 💡 Why Solana?

Traditional finance and layer-1 blockchains like Ethereum cannot service **$1.50 to $10.00 USD daily grocery purchases** (bread, milk, deli items):
* **Sub-Cent Fees (<$0.001)**: Allows microcredit settlements without network gas eating the merchant's margin.
* **400ms Sub-Second Finality**: Essential for real-world retail checkout speed at the counter.
* **Composability**: Allows future credit attestations via standard protocols (e.g. Solana Attestation Service) for third-party microfinance integration.

---

## 💼 Business Model: Who Pays and How Tefi Earns

* **Free for Corner Stores**: The digital ledger is 100% free for merchants, acting as a zero-cost viral acquisition channel.
* **Monetization (Lenders & Fintechs)**: Microfinance institutions and fintechs pay an **origination fee (1-2%) or API query fee** to access pre-qualified, unbanked neighborhood borrowers who have established verified repayment discipline on Tefi.
* **Transaction Fee**: A nominal 1% network maintenance fee upon final debt settlement.

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

* **Program ID**: [`3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc`](https://explorer.solana.com/address/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet) (Executable Anchor Program on Solana Devnet)
* **Solscan Devnet**: [https://solscan.io/account/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet](https://solscan.io/account/3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc?cluster=devnet)
* **Deployment Tx**: [`5nx39Tk5k9jCjee1tRr3yW7jMSyLXRxMwZVmDYUCZuTKPzRpgMyHdPAdhzGqaPqb2vuYVhHy61WAB9vc7xLeNCdc`](https://explorer.solana.com/tx/5nx39Tk5k9jCjee1tRr3yW7jMSyLXRxMwZVmDYUCZuTKPzRpgMyHdPAdhzGqaPqb2vuYVhHy61WAB9vc7xLeNCdc?cluster=devnet)

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
