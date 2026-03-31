import * as anchor from "@coral-xyz/anchor";

describe("solflux basic test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("runs successfully", async () => {
    console.log("Test running...");
  });
});
