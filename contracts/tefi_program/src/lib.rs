use anchor_lang::prelude::*;

declare_id!("3bs3SLqeGU4EMz4aXsVzuMFPjs3yxjjyhCEkB26UfRQc");

pub const GRACE_PERIOD_SECONDS: i64 = 30 * 86400; // 30 días de gracia obligatorios antes de seguro
pub const BASE_INSURANCE_FEE_BPS: u16 = 250; // 2.50% base
pub const MAX_INSURANCE_FEE_BPS: u16 = 1200; // 12.00% tope actuarial

#[program]
pub mod tefi_program {
    use super::*;

    /// 1. Inicializar perfil de comercio
    pub fn initialize_merchant(
        ctx: Context<InitializeMerchant>,
        business_name: String,
        category: String,
    ) -> Result<()> {
        require!(business_name.len() <= 50, TefiError::StringTooLong);
        require!(category.len() <= 30, TefiError::StringTooLong);

        let merchant = &mut ctx.accounts.merchant_profile;
        merchant.owner = ctx.accounts.merchant.key();
        merchant.business_name = business_name;
        merchant.category = category;
        merchant.total_sales_usdc = 0;
        merchant.total_defaulted_usdc = 0;
        merchant.default_rate_bps = 0;
        merchant.insurance_fee_bps = BASE_INSURANCE_FEE_BPS;
        merchant.fiado_nonce = 0;
        merchant.bump = ctx.bumps.merchant_profile;
        Ok(())
    }

    /// 2. Inicializar perfil de cliente (Vecino) con crédito base
    pub fn initialize_customer(
        ctx: Context<InitializeCustomer>,
    ) -> Result<()> {
        let customer = &mut ctx.accounts.customer_profile;
        customer.owner = ctx.accounts.customer.key();
        customer.credit_score = 65; // Score inicial base de confianza barrial
        customer.credit_limit_usdc = 50_000_000; // 50 USDC base (micro-usdc)
        customer.active_debt_usdc = 0;
        customer.total_repaid_usdc = 0;
        customer.loyalty_points = 0;
        customer.bump = ctx.bumps.customer_profile;
        Ok(())
    }

    /// 3. Emitir fiado con foto y consentimiento bilateral (ambos firman)
    pub fn issue_fiado(
        ctx: Context<IssueFiado>,
        amount_usdc: u64,
        due_timestamp: i64,
        receipt_hash: String,
    ) -> Result<()> {
        require!(amount_usdc > 0, TefiError::InvalidAmount);
        require!(receipt_hash.len() <= 64, TefiError::ReceiptHashTooLong);

        let clock = Clock::get()?;
        require!(due_timestamp > clock.unix_timestamp, TefiError::InvalidDueDate);

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
        fiado.nonce = merchant.fiado_nonce;
        fiado.status = 1; // 1 = ACTIVE
        fiado.bump = ctx.bumps.fiado_record;

        // Incrementar nonce secuencial para evitar colisiones de PDA
        merchant.fiado_nonce = merchant.fiado_nonce.saturating_add(1);

        // Actualizar estados contables
        customer.active_debt_usdc = customer.active_debt_usdc.saturating_add(amount_usdc);
        merchant.total_sales_usdc = merchant.total_sales_usdc.saturating_add(amount_usdc);

        emit!(FiadoIssuedEvent {
            merchant: merchant.owner,
            customer: customer.owner,
            amount_usdc,
            due_timestamp,
            nonce: fiado.nonce,
        });

        Ok(())
    }

    /// 4. Pagar el fiado (Repayment): Aumenta reputación, suma puntos y sube límite
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
            new_credit_limit: customer.credit_limit_usdc,
        });

        Ok(())
    }

    /// 5. Reclamar indemnización del Pool de Seguro por mora:
    /// Requiere período de gracia de 30 días posteriores al vencimiento.
    /// Incrementa la prima de seguro actuarial del comercio para desincentivar fraudes.
    pub fn claim_insurance(ctx: Context<ClaimInsurance>) -> Result<()> {
        let fiado = &mut ctx.accounts.fiado_record;
        let merchant = &mut ctx.accounts.merchant_profile;
        let customer = &mut ctx.accounts.customer_profile;

        require!(fiado.status == 1, TefiError::FiadoNotActive);

        let clock = Clock::get()?;
        let required_maturity = fiado.due_timestamp.saturating_add(GRACE_PERIOD_SECONDS);
        require!(clock.unix_timestamp >= required_maturity, TefiError::GracePeriodNotExpired);

        fiado.status = 3; // 3 = INSURANCE_CLAIMED

        // Actualizar métricas del comercio
        merchant.total_defaulted_usdc = merchant.total_defaulted_usdc.saturating_add(fiado.amount_usdc);

        // Recalcular tasa actuarial: prima dinámica ajustada por morosidad
        let default_rate = (merchant.total_defaulted_usdc as u128 * 10_000) / (merchant.total_sales_usdc as u128).max(1);
        merchant.default_rate_bps = default_rate as u16;

        let variable_fee = (default_rate * 45) / 100;
        merchant.insurance_fee_bps = std::cmp::min(MAX_INSURANCE_FEE_BPS, (BASE_INSURANCE_FEE_BPS as u128 + variable_fee) as u16);

        // Penalizar al deudor en su score on-chain (-30) y recortar límite al 50%
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
        space = 8 + 32 + 54 + 34 + 8 + 8 + 2 + 2 + 8 + 1,
        seeds = [b"merchant", merchant.key().as_ref()],
        bump
    )]
    pub merchant_profile: Account<'info, MerchantProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeCustomer<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,
    #[account(
        init,
        payer = customer,
        space = 8 + 32 + 1 + 8 + 8 + 8 + 4 + 1,
        seeds = [b"customer", customer.key().as_ref()],
        bump
    )]
    pub customer_profile: Account<'info, CustomerProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IssueFiado<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(mut)]
    pub customer: Signer<'info>, // <-- Firma obligatoria del cliente para consentir la deuda
    #[account(mut, seeds = [b"merchant", merchant.key().as_ref()], bump = merchant_profile.bump)]
    pub merchant_profile: Account<'info, MerchantProfile>,
    #[account(mut, seeds = [b"customer", customer.key().as_ref()], bump = customer_profile.bump)]
    pub customer_profile: Account<'info, CustomerProfile>,
    #[account(
        init,
        payer = merchant,
        space = 8 + 32 + 32 + 8 + 8 + 68 + 8 + 1 + 1,
        seeds = [b"fiado", merchant.key().as_ref(), customer.key().as_ref(), &merchant_profile.fiado_nonce.to_le_bytes()],
        bump
    )]
    pub fiado_record: Account<'info, FiadoRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayFiado<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,
    #[account(mut, seeds = [b"customer", customer.key().as_ref()], bump = customer_profile.bump)]
    pub customer_profile: Account<'info, CustomerProfile>,
    #[account(mut, seeds = [b"fiado", fiado_record.merchant.as_ref(), customer.key().as_ref(), &fiado_record.nonce.to_le_bytes()], bump = fiado_record.bump)]
    pub fiado_record: Account<'info, FiadoRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimInsurance<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(mut, seeds = [b"merchant", merchant.key().as_ref()], bump = merchant_profile.bump)]
    pub merchant_profile: Account<'info, MerchantProfile>,
    #[account(mut, seeds = [b"customer", fiado_record.customer.as_ref()], bump = customer_profile.bump)]
    pub customer_profile: Account<'info, CustomerProfile>,
    #[account(mut, seeds = [b"fiado", merchant.key().as_ref(), fiado_record.customer.as_ref(), &fiado_record.nonce.to_le_bytes()], bump = fiado_record.bump)]
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
    pub fiado_nonce: u64,
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
    pub nonce: u64,
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
    pub nonce: u64,
}

#[event]
pub struct FiadoRepaidEvent {
    pub customer: Pubkey,
    pub amount_usdc: u64,
    pub new_credit_score: u8,
    pub new_credit_limit: u64,
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
    #[msg("El monto del fiado debe ser mayor a cero.")]
    InvalidAmount,
    #[msg("La fecha de vencimiento debe ser posterior a la fecha actual.")]
    InvalidDueDate,
    #[msg("El hash del comprobante excede el tamaño máximo permitido.")]
    ReceiptHashTooLong,
    #[msg("El texto ingresado excede el tamaño máximo permitido.")]
    StringTooLong,
    #[msg("Este fiado ya no se encuentra activo.")]
    FiadoNotActive,
    #[msg("El plazo de gracia obligatorio (30 días de mora) aún no ha vencido.")]
    GracePeriodNotExpired,
}
