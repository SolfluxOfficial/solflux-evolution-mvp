cat > programs/solflux_evolution_mvp/src/instructions/mint.rs <<'EOF'
use anchor_lang::prelude::*;

pub fn mint_nft(ctx: Context<MintNFT>) -> Result<()> {
    msg!("Solflux NFT Mint Instruction Called");
    Ok(())
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
EOF

