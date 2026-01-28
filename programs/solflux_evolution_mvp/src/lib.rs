use anchor_lang::prelude::*;

declare_id!("5X7XK9nGW9DGt7URsdihdnmDevWQAbpoU2rrDn4oLnX1");

#[program]
pub mod solflux_evolution_mvp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
