use anchor_lang::prelude::*;

#[account]
pub struct SolfluxNFT {
    pub owner: Pubkey,        // NFT kis user ka hai
    pub level: u8,            // Evolution level
    pub xp: u64,              // Experience points
    pub staked: bool,         // Stake status
}

impl SolfluxNFT {
    pub const SIZE: usize =
        8 +     // Anchor discriminator
        32 +    // owner pubkey
        1 +     // level
        8 +     // xp
        1;      // staked bool
}
