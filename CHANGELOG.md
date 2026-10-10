# Changelog

Notable changes to Tefi.app. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no tagged releases yet, so entries are grouped by date. For anything older than the first entry, see the git history.

## 2026-10-10 · Two-phone co-signing on a redeployed program

Pull request [devOr05/tefi-app#1](https://github.com/devOr05/tefi-app/pull/1), written in response to the Superteam Argentina review of 10 Oct 2026.

### Added

- **Two-phone co-signing.** Each phone holds only the key of its role. The store builds `issue_fiado` or `repay_fiado` as fee payer, signs it first and shows the partially signed transaction as a QR code or link. The neighbor's phone verifies the store signature, refuses anything that is not exactly a Tefi fiado or repayment addressed to its own key, checks the receipt against the signed hash, adds the second signature and submits ([`src/solana/cosign.ts`](src/solana/cosign.ts)).
- **Store as fee payer.** The store pays the fee and rent of every transaction, including the neighbor's profile inside their first fiado, so a neighbor never needs SOL.
- **Devnet deployment under a new program id**, [`9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ`](https://explorer.solana.com/address/9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ?cluster=devnet). The deployed bytes are the `tefi_program-sbf` artifact built by CI (282,728 bytes, SHA-256 `d34303c5…6ca2e7`).
- **One role per phone.** On first use a phone is set up as the store or as a neighbor and creates only that key. A phone coming from the previous version, which stored both keys, is asked once and keeps only the key of the role it chooses.
- **Own name per phone.** Setting up a phone asks for the name of the store or of the neighbor. The store name is saved in its on-chain profile; the neighbor's name stays on the phones.
- **"Single-device demo" label**, shown permanently when both keys live in the same browser.
- **Passbook read from the chain.** Fiados, score, limit, debt and repaid total come from the program accounts, refreshed every 20 seconds.
- **Full Spanish and English UI**: screens, explanations, menus and error messages, switched with an Argentina / USA flag control. The app starts in English.
- **Request pacing under the RPC rate limit.** The public devnet node accepts about 40 requests per 10 seconds per IP, shared by every phone on the same network, and counts rejected requests too. On a `429` the app repeats the request and spaces out all the requests of that phone until the node accepts again ([`src/solana/rpcRetry.ts`](src/solana/rpcRetry.ts)).
- **`VITE_SOLANA_DEVNET_RPC_URL`** build variable to use another devnet endpoint.
- **Lender read script**: `npm run read:history -- <neighbor public key>` prints a neighbor's profile and fiados straight from the chain.
- **End-to-end run against devnet**: `npm run e2e:devnet` drives the built PWA with four isolated browser profiles (two stores, two neighbors) and verifies every step on-chain. 44 checks ([`e2e/two-phones-devnet.mjs`](e2e/two-phones-devnet.mjs)).
- **Unit tests that import the real modules**: 66 Vitest tests for the co-signature protocol, instruction building and account decoding, RPC error classification, request pacing, the debt ledger, the passbook view and translation completeness.
- **Anchor tests**: 14, adding a store-sponsored profile for a neighbor with 0 SOL, rejection of a plaintext receipt and a two-device partial-signing round trip.
- **"Roadmap · not built yet" card** listing what the app does not do yet.

### Changed

- **Program** ([`lib.rs`](contracts/tefi_program/programs/tefi_program/src/lib.rs)): `initialize_customer` takes a separate `payer`; `issue_fiado` rejects any `receipt_hash` that is not a 64-character hex digest (new error `InvalidReceiptHash`, 6008); the neighbor account is no longer writable in `issue_fiado` and `repay_fiado`; standard Anchor release profile with overflow checks.
- **Program id.** Replaces the 06/10 deployment (`3bs3SLqe…`), which did not include the bilateral `repay_fiado` and could not be upgraded. The id is declared in `declare_id!`, `Anchor.toml`, the IDL and `src/solana/program.ts`; CI and `npm test` fail if they disagree.
- **`receipt_hash`** is the SHA-256 of the receipt (amount, items, photo hash). The purchase details and the photo stay on the phones.
- **Co-sign QR** renews itself with a fresh blockhash before it expires, and the store phone follows the transaction by its own signature. Confirmation uses polling instead of WebSockets.
- **A QR that was already used** is reported as such instead of as "out of date".
- **`npm test`** runs Vitest. The previous scripts searched the source code for strings.
- **CI** reads the program id from `Anchor.toml`, checks it against `lib.rs` and the IDL, and publishes the stripped SBF binary as an artifact.
- **README** rewritten to match the code: Anchor 0.29.0, the two-phone flow, the store as fee payer, hashed receipts, real test counts, live transaction links and the business model stated as a hypothesis.

### Removed

- **Simulated modules** that were shown as working: the savings fountain, linked fiat accounts, the insurance pool dashboard, partner stores and promotions, seed demo fiados, the 1% fee text and the DID / webhook badges. They remain in the git history.
- The SPL Memo broadcast, the insurance vault address and `didUri`.
- The string-matching test scripts (`scripts/test-contracts.js`, `scripts/test-financial-integrity.js`).
- The internal correction report and the duplicated `contracts/tefi_program/src/lib.rs`.
- The "over 70% of local grocery purchases" claim, which had no source.

### Fixed

- Purchase details were written on-chain in plain text through `receipt_hash`.
- Both keys lived in the same browser and the QR carried no signature, so a fiado could be recorded from a single phone without saying so.
- Every store was called "Almacén Don Tito" and every neighbor "Matías González".
- A rate-limited RPC request failed the operation on the first rejection instead of being retried.
- CI tested the unstripped program binary (444 KB) instead of the stripped one that gets deployed (283 KB).

### Verified on devnet

Produced by the end-to-end run on 10 Oct 2026. The "phones" are isolated browser profiles on one computer.

| Step | Transaction |
| :--- | :--- |
| Deployment | [`5AJEhGf3…XjuiR`](https://explorer.solana.com/tx/5AJEhGf3mYkMxPz1NZkGMY6s8Snei6kwRWU1Ynw7zwXK4APffcgwbd2J1QTTupQ8kPqSu1fWvZ8K8F3KHGeXjuiR?cluster=devnet) |
| `issue_fiado`, store + neighbor | [`3Vz3F87x…PbHqr`](https://explorer.solana.com/tx/3Vz3F87xWHKK2eFcGwek4dszKkBQy9doYqbkZq8tSAffurYXn5m6SZnP5tF2aYc3BcBpeVMUhusFCwBZSXyPbHqr?cluster=devnet) |
| `repay_fiado`, store + neighbor | [`2qMhMNXX…mQVC3`](https://explorer.solana.com/tx/2qMhMNXXGHhg8WgNZifS3x9zKPcFGXFJviVBaDtQYNqEma97YKjVJEsWXMMcycjEMeLNhUfPernvGJzBXyKmQVC3?cluster=devnet) |
| `issue_fiado`, second store + same neighbor | [`3wTwH8L3…ak5h3`](https://explorer.solana.com/tx/3wTwH8L3JPKGoDSask92qV5hy56XgBQR1jsGcyykAPd491nZwhqacy3nvxahmf1iH7v2wz8yV9W49eaLbTeak5h3?cluster=devnet) |
| Two counters in parallel | [`4L6QB4fL…8RC4b`](https://explorer.solana.com/tx/4L6QB4fL2CbzpcNZA1n6cLqihbfyTHbqoRyymtWrPt5cSMejeDdtogdhHATB1n6RPxVAZ1yZVtja2LSEr1y8RC4b?cluster=devnet) · [`BzkPayy7…47ZrG`](https://explorer.solana.com/tx/BzkPayy772DM9i7XJ2vNmxv5iewmX3uLSd949SUm8doe4tdUPhzPJbN2QvZfLfYdkWg6zCzUYecoF9oDqs47ZrG?cluster=devnet) |

### Known limitations

- Scanning the co-sign QR with the camera of a second physical phone has not been verified. *Send link* does not depend on the camera.
- Signing keys are kept in the browser's `localStorage`: acceptable for a devnet prototype, not for a pilot with real neighbors.
- Tefi records the debt and its repayment. USDC amounts are a unit of account, not token transfers.
