use anchor_lang::prelude::*;

declare_id!("TefiProg111111111111111111111111111111111111");

#[program]
pub mod tefi_program {
    use super::*;

    /// 1. Inicializar perfil de comercio
    pub fn initialize_merchant(
        ctx: Context<InitializeMerchant>,
        business_name: String,
        category: String,
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant_profile;
        merchant.owner = ctx.accounts.merchant.key();
        merchant.business_name = business_name;
        merchant.category = category;
        merchant.total_sales_usdc = 0;
        merchant.total_defaulted_usdc = 0;
        merchant.default_rate_bps = 0;
        merchant.insurance_fee_bps = 250; // 2.50% tasa base
        merchant.bump = ctx.bumps.merchant_profile;
        Ok(())
    }

    /// 2. Emitir fiado con foto del ticket/mercaderia
    pub fn issue_fiado(
        ctx: Context<IssueFiado>,
        amount_usdc: u64,
        due_timestamp: i64,
        receipt_hash: String,
    ) -> Result<()> {
        let customer = &mut ctx.accounts.customer_profile;
        let merchant = &mut ctx.accounts.merchant_profile;
        let fiado = &mut ctx.accounts.fiado_record;

        // Validar límite crediticio del cliente
        let available_limit = customer.credit_limit_usdc.saturating_sub(customer.active_debt_usdc);
        require!(amount_usdc <= available_limit, TefiError::CreditLimitExceeded);

        // Inicializar registro de fiado
        fiado.merchant = merchant.owner;
        fiado.customer = customer.owner;
        fiado.amount_usdc = amount_usdc;
        fiado.due_timestamp = due_timestamp;
        fiado.receipt_hash = receipt_hash;
        fiado.status = 1; // 1 = ACTIVE
        fiado.bump = ctx.bumps.fiado_record;

        // Actualizar estados
        customer.active_debt_usdc = customer.active_debt_usdc.saturating_add(amount_usdc);
        merchant.total_sales_usdc = merchant.total_sales_usdc.saturating_add(amount_usdc);

        emit!(FiadoIssuedEvent {
            merchant: merchant.owner,
            customer: customer.owner,
            amount_usdc,
            due_timestamp,
        });

        Ok(())
    }

    /// 3. Pagar el fiado (Repayment): Aumenta reputación, suma puntos y sube límite
    pub fn repay_fiado(ctx: Context<RepayFiado>) -> Result<()> {
        let fiado = &mut ctx.accounts.fiado_record;
        let customer = &mut ctx.accounts.customer_profile;

        require!(fiado.status == 1, TefiError::FiadoNotActive);

        fiado.status = 2; // 2 = PAID

        // Reducir deuda
        customer.active_debt_usdc = customer.active_debt_usdc.saturating_sub(fiado.amount_usdc);
        customer.total_repaid_usdc = customer.total_repaid_usdc.saturating_add(fiado.amount_usdc);

        // Aumentar Score de Reputación On-Chain (+5) hasta 100
        customer.credit_score = std::cmp::min(100, customer.credit_score + 5);

        // Expandir límite de crédito por buen cumplimiento (+$5 USDC = 5_000_000 micro-usdc)
        customer.credit_limit_usdc = customer.credit_limit_usdc.saturating_add(5_000_000);

        // Puntos de lealtad (20 pts por cada USDC)
        let points = (fiado.amount_usdc / 1_000_000).saturating_mul(20) as u32;
        customer.loyalty_points = customer.loyalty_points.saturating_add(points);

        emit!(FiadoRepaidEvent {
            customer: customer.owner,
            amount_usdc: fiado.amount_usdc,
            new_credit_score: customer.credit_score,
        });

        Ok(())
    }

    /// 4. Reclamar indemnización del Pool de Seguro por mora:
    /// El comercio cobra, pero se incrementa su tasa actuarial de seguro (evita fraude y selección adversa)
    pub fn claim_insurance(ctx: Context<ClaimInsurance>) -> Result<()> {
        let fiado = &mut ctx.accounts.fiado_record;
        let merchant = &mut ctx.accounts.merchant_profile;
        let customer = &mut ctx.accounts.customer_profile;

        require!(fiado.status == 1, TefiError::FiadoNotActive);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp >= fiado.due_timestamp, TefiError::FiadoNotMatured);

        fiado.status = 3; // 3 = INSURANCE_CLAIMED

        // Actualizar métricas del comercio
        merchant.total_defaulted_usdc = merchant.total_defaulted_usdc.saturating_add(fiado.amount_usdc);

        // Recalcular tasa actuarial: si mora aumenta, prima aumenta proporcionalmente
        let default_rate = (merchant.total_defaulted_usdc as u128 * 10_000) / (merchant.total_sales_usdc as u128).max(1);
        merchant.default_rate_bps = default_rate as u16;

        // Fórmula: 250 bps base + (default_rate_bps * 45 / 100), tope en 1200 bps (12%)
        let variable_fee = (default_rate * 45) / 100;
        merchant.insurance_fee_bps = std::cmp::min(1200, (250 + variable_fee) as u16);

        // Penalizar severamente al deudor en su score on-chain (-30) y cortar límite
        customer.credit_score = customer.credit_score.saturating_sub(30).max(10);
        customer.credit_limit_usdc = customer.credit_limit_usdc / 2;
        customer.active_debt_usdc = customer.active_debt_usdc.saturating_sub(fiado.amount_usdc);

        emit!(InsuranceClaimedEvent {
            merchant: merchant.owner,
            defaulted_customer: customer.owner,
            payout_amount: fiado.amount_usdc,
            new_insurance_fee_bps: merchant.insurance_fee_bps,
        });

        Ok(())
    }
}

// -------------------------------------------------------------
// ACCOUNTS & CONTEXTS
// -------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeMerchant<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(
        init,
        payer = merchant,
        space = 8 + 32 + 64 + 32 + 8 + 8 + 2 + 2 + 1,
        seeds = [b"merchant", merchant.key().as_ref()],
        bump
    )]
    pub merchant_profile: Account<'info, MerchantProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IssueFiado<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(mut, seeds = [b"merchant", merchant.key().as_ref()], bump = merchant_profile.bump)]
    pub merchant_profile: Account<'info, MerchantProfile>,
    #[account(mut, seeds = [b"customer", customer_profile.owner.as_ref()], bump)]
    pub customer_profile: Account<'info, CustomerProfile>,
    #[account(
        init,
        payer = merchant,
        space = 8 + 32 + 32 + 8 + 8 + 128 + 1 + 1,
        seeds = [b"fiado", merchant.key().as_ref(), &customer_profile.owner.to_bytes(), &due_timestamp.to_le_bytes()],
        bump
    )]
    pub fiado_record: Account<'info, FiadoRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayFiado<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,
    #[account(mut, seeds = [b"customer", customer.key().as_ref()], bump)]
    pub customer_profile: Account<'info, CustomerProfile>,
    #[account(mut, seeds = [b"fiado", fiado_record.merchant.as_ref(), customer.key().as_ref(), &fiado_record.due_timestamp.to_le_bytes()], bump = fiado_record.bump)]
    pub fiado_record: Account<'info, FiadoRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimInsurance<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(mut, seeds = [b"merchant", merchant.key().as_ref()], bump = merchant_profile.bump)]
    pub merchant_profile: Account<'info, MerchantProfile>,
    #[account(mut, seeds = [b"customer", fiado_record.customer.as_ref()], bump)]
    pub customer_profile: Account<'info, CustomerProfile>,
    #[account(mut, seeds = [b"fiado", merchant.key().as_ref(), fiado_record.customer.as_ref(), &fiado_record.due_timestamp.to_le_bytes()], bump = fiado_record.bump)]
    pub fiado_record: Account<'info, FiadoRecord>,
}

// -------------------------------------------------------------
// STRUCTS
// -------------------------------------------------------------

#[account]
pub struct MerchantProfile {
    pub owner: Pubkey,
    pub business_name: String,
    pub category: String,
    pub total_sales_usdc: u64,
    pub total_defaulted_usdc: u64,
    pub default_rate_bps: u16,
    pub insurance_fee_bps: u16,
    pub bump: u8,
}

#[account]
pub struct CustomerProfile {
    pub owner: Pubkey,
    pub credit_score: u8,
    pub credit_limit_usdc: u64,
    pub active_debt_usdc: u64,
    pub total_repaid_usdc: u64,
    pub loyalty_points: u32,
    pub bump: u8,
}

#[account]
pub struct FiadoRecord {
    pub merchant: Pubkey,
    pub customer: Pubkey,
    pub amount_usdc: u64,
    pub due_timestamp: i64,
    pub receipt_hash: String,
    pub status: u8,
    pub bump: u8,
}

// -------------------------------------------------------------
// EVENTS & ERRORS
// -------------------------------------------------------------

#[event]
pub struct FiadoIssuedEvent {
    pub merchant: Pubkey,
    pub customer: Pubkey,
    pub amount_usdc: u64,
    pub due_timestamp: i64,
}

#[event]
pub struct FiadoRepaidEvent {
    pub customer: Pubkey,
    pub amount_usdc: u64,
    pub new_credit_score: u8,
}

#[event]
pub struct InsuranceClaimedEvent {
    pub merchant: Pubkey,
    pub defaulted_customer: Pubkey,
    pub payout_amount: u64,
    pub new_insurance_fee_bps: u16,
}

#[error_code]
pub enum TefiError {
    #[msg("El monto solicitado supera el límite de crédito disponible.")]
    CreditLimitExceeded,
    #[msg("Este fiado ya no se encuentra activo.")]
    FiadoNotActive,
    #[msg("El plazo de gracia no ha vencido aún para reclamar el seguro.")]
    FiadoNotMatured,
}
