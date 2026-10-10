import * as anchorModule from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { assert, expect } from "chai";
import { createHash } from "crypto";

// @ts-ignore
const anchor: typeof anchorModule = (anchorModule as any).default || anchorModule;
// @ts-ignore
const BN = anchor.BN;

// El programa solo acepta el SHA-256 (hex) del ticket: el detalle de la compra queda fuera de la cadena
const receiptHashOf = (ticket: string): string => createHash("sha256").update(ticket).digest("hex");

describe("tefi_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore
  const program = anchor.workspace.TefiProgram;

  const merchantKeypair = Keypair.generate();
  const customerKeypair = Keypair.generate();

  let merchantProfilePda: PublicKey;
  let customerProfilePda: PublicKey;
  let fiadoRecordPda: PublicKey;

  const fiadoPdaFor = (nonce: number): PublicKey => {
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(BigInt(nonce));
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("fiado"),
        merchantKeypair.publicKey.toBuffer(),
        customerKeypair.publicKey.toBuffer(),
        nonceBuffer,
      ],
      program.programId
    )[0];
  };

  before(async () => {
    // Airdrop SOL SOLO al comercio: el vecino nunca recibe SOL (el almacén patrocina rent y comisiones)
    const tx1 = await provider.connection.requestAirdrop(merchantKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature: tx1, ...latest });

    [merchantProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), merchantKeypair.publicKey.toBuffer()],
      program.programId
    );

    [customerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("customer"), customerKeypair.publicKey.toBuffer()],
      program.programId
    );
  });

  it("1. Initialize Merchant Profile PDA", async () => {
    await program.methods
      .initializeMerchant("Almacen Don Tito", "Grocery & Deli")
      .accounts({
        merchant: merchantKeypair.publicKey,
        merchantProfile: merchantProfilePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair])
      .rpc();

    // @ts-ignore
    const merchantAccount = await program.account.merchantProfile.fetch(merchantProfilePda);
    assert.equal(merchantAccount.businessName, "Almacen Don Tito");
    assert.equal(merchantAccount.category, "Grocery & Deli");
    assert.equal(merchantAccount.insuranceFeeBps, 250); // 2.50% base
    assert.equal(merchantAccount.fiadoNonce.toNumber(), 0);
  });

  it("2. Initialize Customer Profile PDA Sponsored by the Store (Customer Holds 0 SOL)", async () => {
    await program.methods
      .initializeCustomer()
      .accounts({
        payer: merchantKeypair.publicKey,
        customer: customerKeypair.publicKey,
        customerProfile: customerProfilePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair, customerKeypair])
      .rpc();

    // @ts-ignore
    const customerAccount = await program.account.customerProfile.fetch(customerProfilePda);
    assert.equal(customerAccount.creditScore, 65); // baseline trust score
    assert.equal(customerAccount.creditLimitUsdc.toNumber(), 50_000_000); // 50 USDC base
    assert.equal(customerAccount.activeDebtUsdc.toNumber(), 0);
    assert.equal(await provider.connection.getBalance(customerKeypair.publicKey), 0); // el vecino no pagó nada
  });

  it("3. Issue Fiado with Bilateral Consent (Both Merchant & Customer Sign)", async () => {
    const amountUsdc = new BN(12_000_000); // 12 USDC
    const dueTimestamp = new BN(Math.floor(Date.now() / 1000) + 14 * 86400); // 14 días
    const receiptHash = receiptHashOf("1 Yerba 1kg + 2 Leches + 1 Pan lactal");

    fiadoRecordPda = fiadoPdaFor(0);

    await program.methods
      .issueFiado(amountUsdc, dueTimestamp, receiptHash)
      .accounts({
        merchant: merchantKeypair.publicKey,
        customer: customerKeypair.publicKey,
        merchantProfile: merchantProfilePda,
        customerProfile: customerProfilePda,
        fiadoRecord: fiadoRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair, customerKeypair])
      .rpc();

    // @ts-ignore
    const fiadoAccount = await program.account.fiadoRecord.fetch(fiadoRecordPda);
    assert.equal(fiadoAccount.amountUsdc.toNumber(), 12_000_000);
    assert.equal(fiadoAccount.status, 1); // 1 = ACTIVE
    assert.equal(fiadoAccount.receiptHash, receiptHash);

    // @ts-ignore
    const customerAccount = await program.account.customerProfile.fetch(customerProfilePda);
    assert.equal(customerAccount.activeDebtUsdc.toNumber(), 12_000_000);
  });

  it("4. Reject Issue Fiado if Customer Signature is Missing", async () => {
    const amountUsdc = new BN(5_000_000);
    const dueTimestamp = new BN(Math.floor(Date.now() / 1000) + 7 * 86400);

    try {
      // Intentar enviar SIN la firma del cliente
      await program.methods
        .issueFiado(amountUsdc, dueTimestamp, receiptHashOf("unauthorized ticket"))
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          merchantProfile: merchantProfilePda,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoPdaFor(1),
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair]) // Falta customerKeypair
        .rpc();

      assert.fail("Should have thrown error because customer did not sign");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("unknown signer") || msg.includes("Signature verification failed")
      );
    }
  });

  it("5. Repay Fiado On-Chain Co-Signed by Store and Customer (Updates Score +5, Raises Credit Limit, Adds Loyalty Points)", async () => {
    await program.methods
      .repayFiado()
      .accounts({
        merchant: merchantKeypair.publicKey,
        customer: customerKeypair.publicKey,
        customerProfile: customerProfilePda,
        fiadoRecord: fiadoRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair, customerKeypair])
      .rpc();

    // @ts-ignore
    const fiadoAccount = await program.account.fiadoRecord.fetch(fiadoRecordPda);
    assert.equal(fiadoAccount.status, 2); // 2 = PAID

    // @ts-ignore
    const customerAccount = await program.account.customerProfile.fetch(customerProfilePda);
    assert.equal(customerAccount.activeDebtUsdc.toNumber(), 0); // Deuda saldada
    assert.equal(customerAccount.creditScore, 70); // 65 + 5 pts
    assert.equal(customerAccount.creditLimitUsdc.toNumber(), 55_000_000); // 50 + 5 USDC
    assert.equal(customerAccount.loyaltyPoints, 240); // 12 USDC * 20 pts
  });

  it("6. Reject Repay Fiado if Merchant Signature is Missing (Anti-Fraud / Anti-Self-Repayment)", async () => {
    const amountUsdc = new BN(4_000_000);
    const dueTimestamp = new BN(Math.floor(Date.now() / 1000) + 7 * 86400);
    const testFiadoPda = fiadoPdaFor(1);

    await program.methods
      .issueFiado(amountUsdc, dueTimestamp, receiptHashOf("300g Jamon cocido + 300g Queso"))
      .accounts({
        merchant: merchantKeypair.publicKey,
        customer: customerKeypair.publicKey,
        merchantProfile: merchantProfilePda,
        customerProfile: customerProfilePda,
        fiadoRecord: testFiadoPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair, customerKeypair])
      .rpc();

    try {
      // Intentar repagar SIN la firma del comercio
      await program.methods
        .repayFiado()
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          customerProfile: customerProfilePda,
          fiadoRecord: testFiadoPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([customerKeypair]) // Falta merchantKeypair
        .rpc();

      assert.fail("Should have failed because merchant did not sign");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("unknown signer") || msg.includes("Signature verification failed")
      );
    }
  });

  it("7. Reject Repay Fiado if Customer Signature is Missing (Anti-Unilateral Settle)", async () => {
    try {
      // Intentar repagar SIN la firma del cliente
      await program.methods
        .repayFiado()
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoPdaFor(1),
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair]) // Falta customerKeypair
        .rpc();

      assert.fail("Should have failed because customer did not sign");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("unknown signer") || msg.includes("Signature verification failed")
      );
    }
  });

  it("8. Reject Repay Fiado from an Unauthorized Merchant (Not Fiado Creator)", async () => {
    const maliciousMerchant = Keypair.generate();
    const airdropSig = await provider.connection.requestAirdrop(maliciousMerchant.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature: airdropSig, ...latest });

    try {
      await program.methods
        .repayFiado()
        .accounts({
          merchant: maliciousMerchant.publicKey,
          customer: customerKeypair.publicKey,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoPdaFor(1),
          systemProgram: SystemProgram.programId,
        })
        .signers([maliciousMerchant, customerKeypair])
        .rpc();

      assert.fail("Should have failed with UnauthorizedMerchant constraint error");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("UnauthorizedMerchant") ||
        msg.includes("ConstraintSeeds") ||
        msg.includes("ConstraintRaw") ||
        msg.includes("fiado_record") ||
        msg.includes("custom program error")
      );
    }
  });

  it("9. Successfully Settle Fiado with Both Valid Signers", async () => {
    const testFiadoPda = fiadoPdaFor(1);

    await program.methods
      .repayFiado()
      .accounts({
        merchant: merchantKeypair.publicKey,
        customer: customerKeypair.publicKey,
        customerProfile: customerProfilePda,
        fiadoRecord: testFiadoPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchantKeypair, customerKeypair])
      .rpc();

    // @ts-ignore
    const fiadoAccount = await program.account.fiadoRecord.fetch(testFiadoPda);
    assert.equal(fiadoAccount.status, 2); // 2 = PAID
  });

  it("10. Reject Double Repayment on Already Paid Fiado (FiadoNotActive)", async () => {
    try {
      await program.methods
        .repayFiado()
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoPdaFor(1),
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair, customerKeypair])
        .rpc();

      assert.fail("Should have failed because fiado is already PAID");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("FiadoNotActive") || msg.includes("6005") || msg.includes("custom program error")
      );
    }
  });

  it("11. Reject Issue Fiado if Amount Exceeds Available Credit Limit", async () => {
    const excessAmount = new BN(150_000_000); // 150 USDC (> limit of 60 USDC)
    const dueTimestamp = new BN(Math.floor(Date.now() / 1000) + 7 * 86400);

    try {
      await program.methods
        .issueFiado(excessAmount, dueTimestamp, receiptHashOf("excess ticket"))
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          merchantProfile: merchantProfilePda,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoPdaFor(2),
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair, customerKeypair])
        .rpc();

      assert.fail("Should have failed with CreditLimitExceeded");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("CreditLimitExceeded") || msg.includes("6000") || msg.includes("custom program error")
      );
    }
  });

  it("12. Claim Insurance Rejection Before 30-Day Grace Period", async () => {
    try {
      await program.methods
        .claimInsurance()
        .accounts({
          merchant: merchantKeypair.publicKey,
          merchantProfile: merchantProfilePda,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoRecordPda,
        })
        .signers([merchantKeypair])
        .rpc();

      assert.fail("Should have failed because grace period has not expired");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("GracePeriodNotExpired") || msg.includes("FiadoNotActive") || msg.includes("custom program error")
      );
    }
  });

  it("13. Reject Issue Fiado if the Receipt is Readable Text Instead of a SHA-256 Hash", async () => {
    const dueTimestamp = new BN(Math.floor(Date.now() / 1000) + 7 * 86400);

    try {
      await program.methods
        .issueFiado(new BN(2_000_000), dueTimestamp, "Yerba 500g")
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          merchantProfile: merchantProfilePda,
          customerProfile: customerProfilePda,
          fiadoRecord: fiadoPdaFor(2),
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair, customerKeypair])
        .rpc();

      assert.fail("Should have failed with InvalidReceiptHash");
    } catch (err: any) {
      expect(err.message).to.satisfy((msg: string) =>
        msg.includes("InvalidReceiptHash") || msg.includes("6008")
      );
    }
  });

  it("14. Two-Device Co-Sign: Store Partially Signs as Fee Payer, Customer Completes and Sends with 0 SOL", async () => {
    const receiptHash = receiptHashOf("1 Pan + 1 Leche");
    const testFiadoPda = fiadoPdaFor(2);

    // Teléfono del almacén: arma la transacción, paga la comisión, firma su parte y la serializa para el QR
    const tx: Transaction = await program.methods
      .issueFiado(new BN(3_000_000), new BN(Math.floor(Date.now() / 1000) + 7 * 86400), receiptHash)
      .accounts({
        merchant: merchantKeypair.publicKey,
        customer: customerKeypair.publicKey,
        merchantProfile: merchantProfilePda,
        customerProfile: customerProfilePda,
        fiadoRecord: testFiadoPda,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
    const latest = await provider.connection.getLatestBlockhash();
    tx.feePayer = merchantKeypair.publicKey;
    tx.recentBlockhash = latest.blockhash;
    tx.partialSign(merchantKeypair);
    const wire = tx.serialize({ requireAllSignatures: false }).toString("base64");

    // Teléfono del vecino: solo recibe el texto del QR, agrega su firma y envía
    const received = Transaction.from(Buffer.from(wire, "base64"));
    assert.isTrue(received.feePayer!.equals(merchantKeypair.publicKey));
    assert.equal(received.signatures.length, 2);
    received.partialSign(customerKeypair);
    const signature = await provider.connection.sendRawTransaction(received.serialize());
    await provider.connection.confirmTransaction({ signature, ...latest });

    // @ts-ignore
    const fiadoAccount = await program.account.fiadoRecord.fetch(testFiadoPda);
    assert.equal(fiadoAccount.status, 1); // 1 = ACTIVE
    assert.equal(fiadoAccount.receiptHash, receiptHash);
    assert.equal(await provider.connection.getBalance(customerKeypair.publicKey), 0); // el vecino nunca tuvo SOL
  });
});
