# Mortgage Cost Simulator

## Overview

The Mortgage Cost Simulator supports two distinct scenario types:

1. **MORTGAGE PURCHASE (Vay mua BĐS)** - Compute payment schedule and total cost for a NEW loan used to buy property
2. **REFINANCE (Tái tài trợ / Chuyển khoản vay)** - Model switching from an existing loan to a new one

## Scenario Types

### 1. Mortgage Purchase Simulation

For users buying a new property with a mortgage loan.

**Key Inputs:**
- `property_value_vnd` - Value of the property
- `down_payment_vnd` - Down payment amount
- `loan_amount_vnd` - Amount to borrow (typically property_value - down_payment)
- `term_months` - Loan term in months
- `horizon_months` - How many months to simulate

**Key Outputs:**
- `closing_cash_needed_vnd` - Total cash needed at closing (down payment + upfront fees)
- `ltv_pct` - Loan-to-Value ratio
- Full amortization schedule
- Total cost breakdown (interest, fees, insurance)

**LTV Validation:**
The simulator validates that `loan_amount_vnd / property_value_vnd <= template.max_ltv_pct`. If exceeded, a warning is included in assumptions.

### 2. Refinance Simulation

For users with an existing mortgage who want to evaluate switching to a new loan.

**Models TWO loans:**
- **OLD loan** - The current mortgage being replaced
- **NEW loan** - The refinance template being evaluated

**Key Inputs (Old Loan):**
- `old_remaining_balance_vnd` - Current outstanding balance
- `old_remaining_term_months` - Months left on old loan
- `old_current_rate_pct` - Current interest rate (fixed for MVP)
- `old_repayment_method` - 'annuity' or 'equal_principal'
- `old_loan_age_months` - How many months already paid (determines prepayment penalty tier)
- `old_prepayment_schedule` - Fee schedule for early payoff

**Key Inputs (New Loan):**
- `new_term_months` - Term for the new loan
- `cash_out_vnd` - Optional additional borrowing
- `refinance_month_index` - When to refinance (0 = now, or future month)

**Key Outputs:**
- `baseline` - Cost of continuing old loan for horizon
- `refinance` - Cost of switching to new loan
- `break_even_month` - When cumulative savings from refinance surpass switching costs
- `net_saving_vnd` - Total savings over horizon (can be negative if refinance costs more)
- `breakdown` - Detailed switching costs (old prepay fee, new processing fee, etc.)

## Calculation Engine

### Core Functions

Located in `/packages/loan-engine/src/engine.ts`:

1. **`simulateLoanSchedule(params)`** - Generic schedule generator for any loan
2. **`simulateMortgagePurchase(template, input, strategy)`** - Full mortgage purchase simulation
3. **`simulateOldLoanBaseline(oldLoan, horizon, startDate)`** - Baseline schedule for old loan
4. **`computeOldLoanPayoffAtRefinance(oldLoan, refinanceMonth, startDate)`** - Calculate payoff amount and fees
5. **`simulateRefinance(template, input, strategy)`** - Complete refinance comparison

### Break-Even Calculation

The break-even month is calculated by comparing cumulative costs:

```
For each month m in 1..horizon_months:
  baseline_cum_cost[m] = sum of (interest + fees + insurance) for old loan up to m
  refinance_cum_cost[m] = 
    old payments before refinance +
    switching costs (old prepay fee + new upfront fees) +
    sum of new loan costs after refinance

  break_even_month = first m where refinance_cum_cost[m] <= baseline_cum_cost[m]
```

If refinance never becomes cheaper, `break_even_month = null`.

### Net Savings Formula

```
net_saving = baseline_total_cost_excl_principal - refinance_total_cost_excl_principal

refinance_total_cost = 
  old_payments_before_refinance +
  old_prepayment_fee +
  new_loan_upfront_fees +
  new_loan_interest_and_fees
```

A positive `net_saving` means refinancing saves money over the horizon.

## Strategies

The simulator automatically runs **3 strategies per scenario type** for comprehensive comparison.

### Mortgage Purchase Strategies (M1, M2, M3)

#### M1: MIN_PAYMENT (Thanh Toán Tối Thiểu)
- Pay only scheduled amounts (principal + interest + recurring fees)
- Maximum liquidity preserved
- No early payoff, no extra principal
- Best for: Cash flow optimization

#### M2: FIXED_EXTRA_PRINCIPAL (Trả Thêm Gốc)
- Pay scheduled amount PLUS fixed extra principal each month
- Configurable: 5tr/10tr/20tr per month
- Reduces total interest over life of loan
- Respects template's `partial_prepay_min_vnd` constraint
- Best for: Reducing total interest cost

#### M3: EXIT_PLAN (Tất Toán Sớm)
- Full payoff at a strategic milestone month
- Milestone types:
  - `END_OF_PROMO`: Payoff at promo_months
  - `END_OF_GRACE`: Payoff at grace_period_months
  - `PREPAY_FEE_THRESHOLD`: Payoff when prepay fee drops below threshold
  - `CUSTOM_MONTH`: User-specified month
- Best for: Planning a specific exit point (e.g., sell property, receive bonus)

### Refinance Strategies (R1, R2, R3)

#### R1: REFI_NOW_LIQUIDITY (Refinance Ngay - Thanh Khoản)
- Refinance immediately (month 0)
- Minimum payment on new loan, no extra principal
- Maximize cash flow improvement from lower rate
- Best for: Immediate rate reduction with liquidity focus

#### R2: REFI_NOW_ACCELERATE (Refinance + Trả Nhanh)
- Refinance immediately (month 0)
- Add extra principal monthly OR use shorter new term
- Configurable: 5tr/10tr/20tr extra per month
- Maximizes long-term savings
- Best for: Aggressive debt reduction

#### R3: OPTIMAL_REFI_TIMING (Thời Điểm Tối Ưu)
- Automatically finds the best month to refinance within horizon
- Optimizes for either:
  - `maximize_saving`: Maximum net savings over horizon
  - `minimize_breakeven`: Fastest break-even point
- Best for: Strategic timing when old prepay penalties are significant

### Strategy Comparison Output

For **Mortgage**, the UI displays a grid:
```
| Gói Vay         | M1 Chi Phí | M2 Chi Phí | M3 Chi Phí | Tiền Mặt Cần | LTV   |
|-----------------|------------|------------|------------|--------------|-------|
| Template A      | 906 triệu  | 785 triệu  | 211 triệu  | 523 triệu    | 80.0% |
```

For **Refinance**, the UI displays:
```
| Gói Refinance   | Baseline   | R1 Tiết Kiệm      | R2 Tiết Kiệm      | R3 Tiết Kiệm      |
|-----------------|------------|-------------------|-------------------|-------------------|
| Template A      | 724 triệu  | +47tr, Hoà vốn T4 | +208tr, Hoà vốn T4 ✓ | +47tr, Hoà vốn T4 |
```

## Templates

Templates are representative loan products (not actual bank products).

### Mortgage Templates (MORTGAGE_RE)
1. **RE_12M_PROMO_STANDARD** - 12-month promo, standard prepay 3-2-1-0
2. **RE_24M_PROMO_GRACE6** - 6-month grace, 24-month promo
3. **RE_36M_FIXED_LOWER_MARGIN** - 36-month promo, lower floating margin

### Refinance Templates (REFINANCE)
1. **RF_12M_PROMO_LOW_FEE** - 0.5% processing fee, 12-month promo
2. **RF_NO_PROMO_LOW_MARGIN** - No promo but low margin throughout
3. **RF_FAST_EXIT** - 6-month promo, low early prepay penalties

## API Endpoints

### GET /api/simulator/templates
Query by category: `?category=MORTGAGE_RE` or `?category=REFINANCE`

### POST /api/simulator/simulate
Supports V1 (legacy), V2 (typed), and V3 (3-strategy) request formats.

**V3 Request (Recommended):**
The V3 API automatically runs all 3 strategies per scenario type.

```json
{
  "version": "v3",
  "template_ids": ["re_standard_12m_promo", "re_grace_24m_promo"],
  "input": {
    "type": "MORTGAGE_RE",
    "property_value_vnd": 2500000000,
    "down_payment_vnd": 500000000,
    "loan_amount_vnd": 2000000000,
    "term_months": 240,
    "horizon_months": 60,
    "include_insurance": true,
    "stress_floating_bump_pct": 2,
    "repayment_method": "annuity"
  },
  "strategy_params": {
    "extra_principal_vnd": 10000000,
    "milestone_type": "END_OF_PROMO"
  }
}
```

**V3 Response (Mortgage):**
```json
{
  "results": [
    {
      "templateId": "re_standard_12m_promo",
      "templateName": "Vay Mua Nhà Tiêu Chuẩn",
      "strategyId": "M1_MIN_PAYMENT",
      "type": "MORTGAGE_RE",
      "mortgage": {
        "closing_cash_needed_vnd": 523000000,
        "ltv_pct": 80,
        "totals": {
          "total_interest": 962000000,
          "total_cost_excl_principal": 962000000,
          "payoff_month": null
        },
        "schedule": [...]
      }
    },
    {
      "templateId": "re_standard_12m_promo",
      "strategyId": "M2_EXTRA_PRINCIPAL",
      "type": "MORTGAGE_RE",
      "mortgage": { ... }
    },
    {
      "templateId": "re_standard_12m_promo",
      "strategyId": "M3_EXIT_PLAN",
      "type": "MORTGAGE_RE",
      "mortgage": {
        "totals": {
          "payoff_month": 12
        }
      }
    }
  ]
}
```

**V3 Response (Refinance):**
```json
{
  "results": [
    {
      "templateId": "rf_low_fee_12m_promo",
      "strategyId": "R1_REFI_NOW_LIQUIDITY",
      "type": "REFINANCE",
      "refinance": {
        "baseline": { "totals": { "total_cost_excl_principal": 724000000 } },
        "refi": { "totals": { ... } },
        "net_saving_vnd": 47000000,
        "break_even_month": 4,
        "switching_costs": {
          "old_prepay_fee": 45000000,
          "new_upfront_fees": 7500000
        }
      }
    },
    {
      "templateId": "rf_low_fee_12m_promo",
      "strategyId": "R2_REFI_ACCELERATE",
      "type": "REFINANCE",
      "refinance": {
        "net_saving_vnd": 208000000,
        "break_even_month": 4
      }
    },
    {
      "templateId": "rf_low_fee_12m_promo",
      "strategyId": "R3_OPTIMAL_TIMING",
      "type": "REFINANCE",
      "refinance": {
        "optimal_refi_month": 0,
        "net_saving_vnd": 47000000
      }
    }
  ]
}
```

## Limitations

1. **Monthly Approximation**: Uses `annual_rate / 12` for monthly calculations. Architecture supports daily/365 mode in the future.

2. **Fixed Old Rate**: For MVP, old loan uses a fixed rate (`old_current_rate_pct`). Rate schedules can be added later.

3. **Fee Financing**: Assumes upfront fees are paid out-of-pocket. Template-based fee financing can be added.

4. **No Actual Products**: Templates are representative only, not matching real bank products.

## Testing

Run tests:
```bash
cd packages/loan-engine
npm test
```

### Mortgage Strategy Tests (M1/M2/M3)
- **M1**: Scheduled payment amounts are correct
- **M2**: Extra principal reduces total interest vs M1
- **M3**: Payoff happens at correct milestone month
- **M3**: Prepayment penalty correctly applied at payoff
- **M3**: Schedule stops after payoff month

### Refinance Strategy Tests (R1/R2/R3)
- **R1**: Refinance at month 0, min payment on new loan
- **R2**: Extra principal reduces total cost vs R1
- **R3**: Optimal month found maximizes `net_saving`
- **R3**: Respects `minimize_breakeven` vs `maximize_saving` goals
- Old payoff fee tier selection based on `old_loan_age_months + refinance_month_index`
- Break-even month computed correctly (cumulative comparison)
- Net saving sign flips when old prepay fee exceeds savings

### General Tests
- `closing_cash_needed` = down_payment + upfront_fees
- LTV validation triggers warning when exceeded
- Rate timeline transitions correctly (promo → floating)
- Grace period delays principal payments

## File Structure

```
packages/loan-engine/
├── src/
│   ├── types.ts       # All TypeScript types and Zod schemas
│   ├── engine.ts      # Core simulation functions
│   ├── templates.ts   # Product templates
│   └── index.ts       # Public exports
└── tests/
    └── engine.test.ts # Comprehensive test suite

apps/web/
├── app/
│   ├── api/simulator/simulate/route.ts  # API endpoint
│   └── (main)/simulator/page.tsx        # Main simulator page
├── components/simulator/
│   ├── category-step.tsx      # Category selection
│   ├── inputs-step.tsx        # Form inputs for both scenarios
│   └── strategy-results-step.tsx  # Results display
└── lib/
    ├── simulator-types.ts     # Frontend type definitions
    └── hooks/use-simulator.ts # React Query hooks
```
