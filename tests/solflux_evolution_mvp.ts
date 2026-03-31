import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { SolfluxEvolutionMvp } from "../target/types/solflux_evolution_mvp";

import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { assert } from "chai";

const PROGRAM_ID = new PublicKey("5nonF1D2LWwmu3j4GrYH2F6ygnPmWUiPb4Lc1KGiyVij");

describe("Solflux MVP flow (marketplace → mint → stake → unstake)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // 👇 explicitly using program id (more reliable than workspace sometimes)
  const program = new Program<SolfluxEvolutionMvp>(
    require("../target/idl/solflux_evolution_mvp.json"),
    PROGRAM_ID,
    provider
  );

  const wallet = provider.wallet;

  let marketplace: anchor.web3.PublicKey;
  let nftAcc: anchor.web3.Keypair;
  let mintKey: anchor.web3.Keypair;

  let userTokenAcc: anchor.web3.PublicKey;
  let vaultTokenAcc: anchor.web3.PublicKey;
  let vaultAuth: anchor.web3.PublicKey;

  it("runs complete NFT lifecycle without breaking anything", async () => {
    // ---- Step 1: Marketplace setup ----
    marketplace = anchor.web3.Keypair.generate().publicKey;

    await program.methods
      .initializeMarketplace()
      .accounts({
        marketplace,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // ---- Step 2: Mint NFT ----
    nftAcc = anchor.web3.Keypair.generate();
    mintKey = anchor.web3.Keypair.generate();

    const [mintAuth] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    userTokenAcc = await getAssociatedTokenAddress(
      mintKey.publicKey,
      wallet.publicKey
    );

    await program.methods
      .mintNft()
      .accounts({
        nftAccount: nftAcc.publicKey,
        mint: mintKey.publicKey,
        userTokenAccount: userTokenAcc,
        mintAuthority: mintAuth,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([nftAcc, mintKey])
      .rpc();

    let userBal = await getAccount(provider.connection, userTokenAcc);
    assert.equal(Number(userBal.amount), 1, "NFT mint failed");

    // ---- Step 3: Stake NFT ----
    [vaultAuth] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), nftAcc.publicKey.toBuffer()],
      program.programId
    );

    vaultTokenAcc = await getAssociatedTokenAddress(
      mintKey.publicKey,
      vaultAuth,
      true
    );

    await program.methods
      .stakeNft()
      .accounts({
        nftAccount: nftAcc.publicKey,
        user: wallet.publicKey,
        userTokenAccount: userTokenAcc,
        vaultTokenAccount: vaultTokenAcc,
        mint: mintKey.publicKey,
        vaultAuthority: vaultAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const afterStakeUser = await getAccount(provider.connection, userTokenAcc);
    const vaultState = await getAccount(provider.connection, vaultTokenAcc);

    assert.equal(Number(afterStakeUser.amount), 0, "User should not hold NFT");
    assert.equal(Number(vaultState.amount), 1, "Vault should hold NFT");

    // ---- Step 4: Unstake NFT ----
    await program.methods
      .unstakeNft()
      .accounts({
        nftAccount: nftAcc.publicKey,
        user: wallet.publicKey,
        userTokenAccount: userTokenAcc,
        vaultTokenAccount: vaultTokenAcc,
        vaultAuthority: vaultAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const finalBal = await getAccount(provider.connection, userTokenAcc);
    assert.equal(Number(finalBal.amount), 1, "Unstake failed, NFT not returned");
  });
});