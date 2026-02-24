use anchor_lang::prelude::*;

declare_id!("2amQivXBjXgNUdh9VBSBtxcQnAjnZiYjf29WU9QhxJ9H");

#[program]
pub mod solflux_evolution_mvp {
    use super::*;

    pub fn mint_nft(ctx: Context<MintNFT>) -> Result<()> {
        let nft = &mut ctx.accounts.nft_account;

        nft.owner = ctx.accounts.user.key();
        nft.level = 1;
        nft.xp = 0;
        nft.staked = false;

        Ok(())
    }

    pub fn stake_nft(ctx: Context<StakeNFT>) -> Result<()> {
        let nft = &mut ctx.accounts.nft_account;

        require_keys_eq!(nft.owner, ctx.accounts.user.key(), CustomError::InvalidOwner);

        nft.staked = true;

        Ok(())
    }

    pub fn evolve_nft(ctx: Context<EvolveNFT>) -> Result<()> {
        let nft = &mut ctx.accounts.nft_account;

        require_keys_eq!(nft.owner, ctx.accounts.user.key(), CustomError::InvalidOwner);
        require!(nft.staked, CustomError::NotStaked);

        nft.xp += 10;

        if nft.xp >= 100 {
            nft.level += 1;
            nft.xp = 0;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 1 + 8 + 1
    )]
    pub nft_account: Account<'info, SolfluxNFT>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeNFT<'info> {
    #[account(mut)]
    pub nft_account: Account<'info, SolfluxNFT>,

    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct EvolveNFT<'info> {
    #[account(mut)]
    pub nft_account: Account<'info, SolfluxNFT>,

    pub user: Signer<'info>,
}

#[account]
pub struct SolfluxNFT {
    pub owner: Pubkey,
    pub level: u8,
    pub xp: u64,
    pub staked: bool,
}

#[error_code]
pub enum CustomError {
    #[msg("You are not the owner.")]
    InvalidOwner,

    #[msg("NFT must be staked.")]
    NotStaked,
}
