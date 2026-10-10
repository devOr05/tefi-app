# Changelog

Notable changes to Tefi.app. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Each entry is headed by the version number the app shows on every screen, which is the `version` of `package.json`. For anything older than the first entry, see the git history.

## 2.1.0 · 2026-10-10 · The version on every screen, and a site that search engines and AI assistants can read

Pull request [devOr05/tefi-app#2](https://github.com/devOr05/tefi-app/pull/2).

### Added

- **Version on every screen.** The header and the first-use screen show a line like `Version 2.1.0 · 687581d · 2026-10-10 13:28`: the version number, the commit the app was built from and the date of that commit in the phone's own time. It links to that commit on GitHub. Apart from the first word it reads the same in both languages, so two phones can be compared at a glance ([`src/version.ts`](src/version.ts)).
- **`/version.json`** says which version is published, without opening the app.
- **`/es/`: the app in Spanish at its own address.** A first-time visitor who opens `/es/` gets the app in Spanish; the root address stays in English. A language chosen with the flags wins over the address.
- **Link previews.** Sharing the address shows a title, a description and a 1200x630 image, in English for `/` and in Spanish for `/es/` (Open Graph and Twitter tags, under 300 kB so WhatsApp shows the image).
- **A page that can be read without JavaScript.** Each language page carries a description, canonical and `hreflang` links, schema.org `WebApplication` data and, inside `<noscript>`, the text of what Tefi is, how it works, six questions and answers, and the links to the code and to the program on Solana Explorer.
- **`robots.txt`, `sitemap.xml` and `llms.txt`** (the description of the site for AI assistants, in the [llmstxt.org](https://llmstxt.org) format).
- **`npm run check:site`** reads the published site the way a crawler without JavaScript does: 34 checks. It runs in CI against the built PWA. Before this version the live site passed 5 of them.
- 30 unit tests (107 in total) for the version label and for everything the site publishes, and one more end-to-end check (46): both phones show the version of the app they run.

### Changed

- The pages, their metadata and the four files above are generated at build time from [`src/site/`](src/site/). The public address they declare defaults to `https://tef-iapp.vercel.app` and can be set with `VITE_SITE_URL`.
- The link preview images are not stored by the service worker of the phones.

### Known limitations

- A search engine that does run JavaScript (Google) indexes the app screen, not the `<noscript>` text.
- Co-sign links and QR codes always point to the root address, so the preview of a request sent by message is in English.

## 2.0.0 · 2026-10-10 · Two-phone co-signing on a redeployed program

Pull request [devOr05/tefi-app#1](https://github.com/devOr05/tefi-app/pull/1), written in response to the Superteam Argentina review of 10 Oct 2026.

### Added

- **Two-phone co-signing.** Each phone holds only the key of its role. The store builds `issue_fiado` or `repay_fiado` as fee payer, signs it first and shows the request as a QR code or link. The neighbor's phone verifies the store signature, refuses anything that is not exactly a Tefi fiado or repayment addressed to its own key, checks the receipt against the signed hash, adds the second signature and submits ([`src/solana/cosign.ts`](src/solana/cosign.ts)).
- **Compact co-sign QR.** The QR carries the store's signature and the fields of the request instead of the serialized transaction: about 420 characters and 61 modules per side for a first fiado, down from 830 characters and 97 modules. Both phones build the message with the same fixed account order, so the neighbor's phone rebuilds exactly what the store signed. The serialized transaction remains as a fallback format.
- **Camera scanner that decodes at camera resolution** ([`src/services/qrDecoder.ts`](src/services/qrDecoder.ts)), using the phone's own barcode detector where the browser has one and jsQR elsewhere. It replaces `html5-qrcode` and makes the app bundle 200 kB smaller.
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
- **End-to-end run against devnet**: `npm run e2e:devnet` drives the built PWA with four isolated browser profiles (two stores, two neighbors) that scan each other's QR through a simulated camera, and verifies every step on-chain. 45 checks ([`e2e/two-phones-devnet.mjs`](e2e/two-phones-devnet.mjs)).
- **Unit tests that import the real modules**: 77 Vitest tests for the co-signature protocol and its compact format, instruction building and account decoding, RPC error classification, request pacing, QR decoding, the debt ledger, the passbook view and translation completeness.
- **Anchor tests**: 14, adding a store-sponsored profile for a neighbor with 0 SOL, rejection of a plaintext receipt and a two-device partial-signing round trip.
- **"Roadmap · not built yet" card** listing what the app does not do yet.

### Changed

- **Program** ([`lib.rs`](contracts/tefi_program/programs/tefi_program/src/lib.rs)): `initialize_customer` takes a separate `payer`; `issue_fiado` rejects any `receipt_hash` that is not a 64-character hex digest (new error `InvalidReceiptHash`, 6008); the neighbor account is no longer writable in `issue_fiado` and `repay_fiado`; standard Anchor release profile with overflow checks.
- **Program id.** Replaces the 06/10 deployment (`3bs3SLqe…`), which did not include the bilateral `repay_fiado` and could not be upgraded. The id is declared in `declare_id!`, `Anchor.toml`, the IDL and `src/solana/program.ts`; CI and `npm test` fail if they disagree.
- **`receipt_hash`** is the SHA-256 of the receipt (amount, items, photo hash). The purchase details and the photo stay on the phones.
- **Co-sign QR** renews itself with a fresh blockhash before it expires, and the store phone follows the transaction by its own signature. Confirmation uses polling instead of WebSockets.
- **A QR that was already used** is reported as such instead of as "out of date".
- **Confirmation dialogs** (using both roles on one device, resetting, removing a key) open in a dialog of the app, in its language and theme, instead of the browser's `confirm` box.
- **`npm test`** runs Vitest. The previous scripts searched the source code for strings.
- **CI** reads the program id from `Anchor.toml`, checks it against `lib.rs` and the IDL, publishes the stripped SBF binary as an artifact and, after the Anchor tests, runs the two-phone end-to-end test against the same local validator.
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
- The in-app scanner could not read a co-sign QR: it shrank the camera image to the size of the viewfinder, a couple of hundred pixels for a code of 97 modules per side.
- Chrome and Edge ignored the app's scrollbar style and drew a flat purple bar. Scrollbars now use the green of the app in every browser, and the page behind an open dialog no longer scrolls.
- A rate-limited RPC request failed the operation on the first rejection instead of being retried.
- CI tested the unstripped program binary (444 KB) instead of the stripped one that gets deployed (283 KB).

### Verified on devnet

Produced by the end-to-end run on 10 Oct 2026. The "phones" are isolated browser profiles on one computer.

| Step | Transaction |
| :--- | :--- |
| Deployment | [`5AJEhGf3…XjuiR`](https://explorer.solana.com/tx/5AJEhGf3mYkMxPz1NZkGMY6s8Snei6kwRWU1Ynw7zwXK4APffcgwbd2J1QTTupQ8kPqSu1fWvZ8K8F3KHGeXjuiR?cluster=devnet) |
| `issue_fiado`, store + neighbor | [`4niTarxJ…KYBzy`](https://explorer.solana.com/tx/4niTarxJ5MXWLK8JtyJSTUHtGoEXZJ4jMQ6dfe5K88N2qk5rTt4NvEyqCnrEUa9w2n9YwcX1bL3mtGKywNsKYBzy?cluster=devnet) |
| `repay_fiado`, store + neighbor | [`5SZ1BdpU…odrSR`](https://explorer.solana.com/tx/5SZ1BdpUVZd114DLdaH776BJpsWyUsnmXenp1RVMzsJhUCv7c8EAcf9uQdjDdT4KCir71NYfXBevyaMjAHQodrSR?cluster=devnet) |
| `issue_fiado`, second store + same neighbor | [`5RKrusTT…RvB35`](https://explorer.solana.com/tx/5RKrusTTmjvW7FEk18pDQ3E5wYYBeb6j4bBxeybz1YsivU9zuk8Zh5meGhHiHDbLSK4SbpWbK4Nck4f899xRvB35?cluster=devnet) |
| Two counters in parallel | [`2kmS3rBj…S5pPz`](https://explorer.solana.com/tx/2kmS3rBjVnEGCdakZnE3NKr9Ngv2SHUNuntWovvBWrhyowJJDQUxjSsvLAHXG17ZHVtqjC4cBTWtTeHZTvXS5pPz?cluster=devnet) · [`BjAZwHt3…ZnBeJ`](https://explorer.solana.com/tx/BjAZwHt3WNyi3NXjuQt4d2NCupna9c9GtEm4qfC6TGHjRSmRmJPsKsQDVjrxbuwGvvSkK9hYtHDeYsgNxkZnBeJ?cluster=devnet) |

### Known limitations

- Scanning has been verified through a simulated camera (a video of the QR tilted, blurred and noisy), not with two physical phones. *Send link* does not depend on the camera.
- Signing keys are kept in the browser's `localStorage`: acceptable for a devnet prototype, not for a pilot with real neighbors.
- Tefi records the debt and its repayment. USDC amounts are a unit of account, not token transfers.
