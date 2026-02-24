import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolfluxEvolutionMvp } from "../target/types/solflux_evolution_mvp";
import { expect } from "chai";

describe("solflux_evolution_mvp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .SolfluxEvolutionMvp as Program<SolfluxEvolutionMvp>;

  const user = provider.wallet;

  const nftAccount = anchor.web3.Keypair.generate();

  it("Mints NFT", async () => {
    await program.methods
      .mintNft()
      .accounts({
        nftAccount: nftAccount.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([nftAccount])
      .rpc();

    const account = await program.account.solfluxNft.fetch(
      nftAccount.publicKey
    );

    expect(account.level).to.equal(1);
    expect(account.xp.toNumber()).to.equal(0);
    expect(account.staked).to.equal(false);
  });

  it("Stakes NFT", async () => {
    await program.methods
      .stakeNft()
      .accounts({
        nftAccount: nftAccount.publicKey,
        user: user.publicKey,
      })
      .rpc();

    const account = await program.account.solfluxNft.fetch(
      nftAccount.publicKey
    );

    expect(account.staked).to.equal(true);
  });

  it("Evolves NFT (adds XP)", async () => {
    await program.methods
      .evolveNft()
      .accounts({
        nftAccount: nftAccount.publicKey,
        user: user.publicKey,
      })
      .rpc();

    const account = await program.account.solfluxNft.fetch(
      nftAccount.publicKey
    );

    expect(account.xp.toNumber()).to.equal(10);
  });

  it("Levels up after 10 evolves (100 XP)", async () => {
    for (let i = 0; i < 9; i++) {
      await program.methods
        .evolveNft()
        .accounts({
          nftAccount: nftAccount.publicKey,
          user: user.publicKey,
        })
        .rpc();
    }

    const account = await program.account.solfluxNft.fetch(
      nftAccount.publicKey
    );

    expect(account.level).to.equal(2);
    expect(account.xp.toNumber()).to.equal(0);
  });
});
