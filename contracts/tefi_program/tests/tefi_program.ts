import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("tefi_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore
  const program = anchor.workspace.TefiProgram as Program;

  const merchantKeypair = Keypair.generate();
  const customerKeypair = Keypair.generate();

  let merchantProfilePda: PublicKey;
  let customerProfilePda: PublicKey;
  let fiadoRecordPda: PublicKey;

  before(async () => {
    // Airdrop SOL a merchant y customer
    const tx1 = await provider.connection.requestAirdrop(merchantKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const tx2 = await provider.connection.requestAirdrop(customerKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature: tx1, ...latest });
    await provider.connection.confirmTransaction({ signature: tx2, ...latest });

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

  it("2. Initialize Customer Profile PDA", async () => {
    await program.methods
      .initializeCustomer()
      .accounts({
        customer: customerKeypair.publicKey,
        customerProfile: customerProfilePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([customerKeypair])
      .rpc();

    // @ts-ignore
    const customerAccount = await program.account.customerProfile.fetch(customerProfilePda);
    assert.equal(customerAccount.creditScore, 65); // baseline trust score
    assert.equal(customerAccount.creditLimitUsdc.toNumber(), 50_000_000); // 50 USDC base
    assert.equal(customerAccount.activeDebtUsdc.toNumber(), 0);
  });

  it("3. Issue Fiado with Bilateral Consent (Both Merchant & Customer Sign)", async () => {
    const amountUsdc = new anchor.BN(12_000_000); // 12 USDC
    const dueTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 14 * 86400); // 14 días
    const receiptHash = "hash_yerba_leche_pan_4a8f9c";
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(BigInt(0));

    [fiadoRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fiado"),
        merchantKeypair.publicKey.toBuffer(),
        customerKeypair.publicKey.toBuffer(),
        nonceBuffer,
      ],
      program.programId
    );

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

    // @ts-ignore
    const customerAccount = await program.account.customerProfile.fetch(customerProfilePda);
    assert.equal(customerAccount.activeDebtUsdc.toNumber(), 12_000_000);
  });

  it("4. Reject Issue Fiado if Customer Signature is Missing", async () => {
    const amountUsdc = new anchor.BN(5_000_000);
    const dueTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 86400);
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(BigInt(1));

    const [unauthorizedFiadoPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fiado"),
        merchantKeypair.publicKey.toBuffer(),
        customerKeypair.publicKey.toBuffer(),
        nonceBuffer,
      ],
      program.programId
    );

    try {
      // Intentar enviar SIN la firma del cliente
      await program.methods
        .issueFiado(amountUsdc, dueTimestamp, "unauthorized_hash")
        .accounts({
          merchant: merchantKeypair.publicKey,
          customer: customerKeypair.publicKey,
          merchantProfile: merchantProfilePda,
          customerProfile: customerProfilePda,
          fiadoRecord: unauthorizedFiadoPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchantKeypair]) // Falta customerKeypair
        .rpc();

      assert.fail("Should have thrown error because customer did not sign");
    } catch (err: any) {
      expect(err.message).to.include("unknown signer");
    }
  });

  it("5. Repay Fiado On-Chain (Updates Score +5, Raises Credit Limit, Adds Loyalty Points)", async () => {
    await program.methods
      .repayFiado()
      .accounts({
        customer: customerKeypair.publicKey,
        customerProfile: customerProfilePda,
        fiadoRecord: fiadoRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([customerKeypair])
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

  it("6. Claim Insurance Rejection Before 30-Day Grace Period", async () => {
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
        msg.includes("GracePeriodNotExpired") || msg.includes("FiadoNotActive")
      );
    }
  });
});
