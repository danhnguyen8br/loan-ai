# Loan-AI Product Specifications

## Document Information
- **Product Name**: Loan-AI Mortgage Simulator
- **Version**: 1.0
- **Last Updated**: December 2025
- **Target Market**: Vietnam

---

## 1. Executive Summary

### 1.1 Product Overview

Loan-AI is a **mortgage cost simulation and comparison tool** designed specifically for the Vietnamese real estate market. The application helps users:

1. **Find optimal loan packages** for purchasing real estate (BĐS)
2. **Evaluate refinancing options** to switch from their current mortgage to a better deal
3. **Compare multiple repayment strategies** to minimize total cost or optimize cash flow

### 1.2 Key Value Propositions

| Feature | User Benefit |
|---------|--------------|
| **Multi-Strategy Comparison** | See 3 different repayment scenarios side-by-side |
| **Intelligent Recommendations** | AI-powered matching based on user's goals and financial situation |
| **Stress Testing** | Understand payment impact when interest rates increase |
| **Detailed Amortization Schedule** | Month-by-month breakdown of principal, interest, and fees |
| **Break-even Analysis** | For refinancing: know exactly when switching pays off |

### 1.3 Target Users

- **Home Buyers**: First-time buyers or investors purchasing real estate in Vietnam
- **Existing Borrowers**: People with active mortgages looking to refinance for better rates
- **Financial Advisors**: Professionals helping clients compare loan options

---

## 2. Product Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Category   │→ │    Inputs    │→ │    Results Display   │   │
│  │   Selection  │  │    Form      │  │  (Strategy Comparison)│   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     API Layer (Next.js Routes)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  /templates  │  │  /simulate   │  │     /recommend       │   │
│  │   (GET)      │  │   (POST)     │  │      (POST)          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Loan Engine Package                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Templates   │  │   Engine     │  │      Types           │   │
│  │ (Products)   │  │ (Calculator) │  │   (Interfaces)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React, TypeScript |
| **Styling** | Tailwind CSS |
| **Data Fetching** | TanStack Query (React Query) |
| **Calculation Engine** | TypeScript (pure functions, no external dependencies) |
| **Testing** | Vitest |
| **Deployment** | Vercel / Railway / Fly.io |

### 2.3 Key Packages

#### `@loan-ai/loan-engine`
The core calculation engine providing:
- Amortization schedule generation
- Multi-strategy simulation (M1/M2/M3 for mortgage, R1/R2/R3 for refinance)
- Rate timeline building
- Fee calculations
- APR/IRR computation

#### `apps/web`
The Next.js frontend application providing:
- User input forms
- API routes
- Result visualization
- Responsive mobile/desktop layouts

---

## 3. Loan Categories

### 3.1 MORTGAGE_RE (Vay Mua BĐS)

**Purpose**: Calculate payment schedules and total costs for NEW property purchase loans.

#### Key Inputs
| Field | Type | Description |
|-------|------|-------------|
| `property_value_vnd` | number | Market value of the property (VND) |
| `down_payment_vnd` | number | Down payment amount (VND) |
| `loan_amount_vnd` | number | Amount to borrow = property_value - down_payment |
| `term_months` | number | Loan term (12-360 months) |
| `horizon_months` | number | Simulation horizon (how long to simulate) |
| `repayment_method` | enum | `annuity` or `equal_principal` |
| `include_insurance` | boolean | Include property insurance |
| `stress.floating_rate_bump_pct` | 0\|2\|4 | Rate increase scenario for stress testing |

#### Key Outputs
| Field | Description |
|-------|-------------|
| `closing_cash_needed_vnd` | Total cash needed at closing (down payment + upfront fees) |
| `ltv_pct` | Loan-to-Value ratio (%) |
| `schedule` | Full month-by-month amortization |
| `totals.total_cost_excl_principal` | Total interest + fees + insurance |
| `metrics.monthly_payment_initial` | Average first 3 months payment |
| `metrics.payoff_month` | Month when loan is fully paid (for exit strategies) |

#### LTV Validation
- System validates that `loan_amount / property_value ≤ max_ltv_pct`
- Typical maximum: 80% LTV
- Warning displayed if exceeded

---

### 3.2 REFINANCE (Chuyển Ngân Hàng)

**Purpose**: Model switching from an existing loan to a new one to evaluate potential savings.

#### Key Inputs (Old Loan)
| Field | Type | Description |
|-------|------|-------------|
| `old_remaining_balance_vnd` | number | Current outstanding balance |
| `old_remaining_term_months` | number | Months left on old loan |
| `old_current_rate_pct` | number | Current interest rate (fixed for MVP) |
| `old_repayment_method` | enum | `annuity` or `equal_principal` |
| `old_loan_age_months` | number | How many months already paid |
| `old_prepayment_schedule` | array | Fee schedule for early payoff |

#### Key Inputs (New Loan)
| Field | Type | Description |
|-------|------|-------------|
| `new_term_months` | number | Term for the refinanced loan |
| `cash_out_vnd` | number | Optional additional borrowing |
| `refinance_month_index` | number | When to refinance (0 = now) |

#### Key Outputs
| Field | Description |
|-------|-------------|
| `baseline` | Cost of continuing with old loan |
| `refinance` | Cost of switching to new loan |
| `break_even_month` | Month when cumulative savings exceed switching costs |
| `net_saving_vnd` | Total savings over horizon (can be negative) |
| `breakdown.switching_costs_total` | Old prepay fee + new upfront fees |

---

## 4. Repayment Strategies

### 4.1 Mortgage Strategies (M1, M2, M3)

#### M1: MIN_PAYMENT (Thanh Toán Tối Thiểu)
**Philosophy**: Pay only scheduled amounts to maximize cash flow liquidity.

| Aspect | Detail |
|--------|--------|
| **Monthly Payment** | Standard annuity or equal principal |
| **Extra Principal** | None |
| **Early Payoff** | None |
| **Best For** | Cash flow optimization, investing elsewhere |
| **Pros** | Maximum monthly liquidity, simple budgeting |
| **Cons** | Highest total interest, longest payoff time |

#### M2: FIXED_EXTRA_PRINCIPAL (Trả Thêm Gốc)
**Philosophy**: Pay extra principal each month to reduce total interest.

| Aspect | Detail |
|--------|--------|
| **Monthly Payment** | Scheduled + fixed extra amount |
| **Extra Principal** | Configurable (5tr/10tr/20tr/month) |
| **Minimum Prepay** | Respects template's `partial_prepay_min_vnd` |
| **Best For** | Stable income, reducing total cost |
| **Pros** | Significantly reduces interest, faster payoff |
| **Cons** | Reduced liquidity, may incur prepayment fees |

#### M3: EXIT_PLAN (Tất Toán Sớm)
**Philosophy**: Full payoff at a strategic milestone.

| Milestone Type | Description |
|----------------|-------------|
| `PROMO_END` | Payoff at end of promotional rate period |
| `GRACE_END` | Payoff at end of grace period |
| `FEE_THRESHOLD` | Payoff when prepay fee drops below threshold |
| `CUSTOM` | User-specified month |

| Aspect | Detail |
|--------|--------|
| **Best For** | Planning to sell property, receiving large bonus |
| **Pros** | Maximum interest savings if executed |
| **Cons** | Requires large lump sum, prepayment fees apply |

---

### 4.2 Refinance Strategies (R1, R2, R3)

#### R1: REFI_NOW_LIQUIDITY (Refinance Ngay - Giữ Thanh Khoản)
**Philosophy**: Refinance immediately with minimum payment on new loan.

| Aspect | Detail |
|--------|--------|
| **Refinance Timing** | Month 0 (immediate) |
| **New Loan Payment** | Minimum scheduled |
| **Best For** | Immediate rate reduction, maximize cash flow |
| **Pros** | Quick savings, lower monthly burden |
| **Cons** | Old prepay fee applies immediately |

#### R2: REFI_NOW_ACCELERATE (Refinance + Trả Nhanh)
**Philosophy**: Refinance immediately AND pay extra principal monthly.

| Aspect | Detail |
|--------|--------|
| **Refinance Timing** | Month 0 (immediate) |
| **Extra Principal** | Configurable (5tr/10tr/20tr/month) |
| **Best For** | Aggressive debt reduction |
| **Pros** | Maximum long-term savings |
| **Cons** | High initial cash requirement |

#### R3: OPTIMAL_TIMING (Thời Điểm Tối Ưu)
**Philosophy**: Automatically find the best month to refinance.

| Objective | Optimization Goal |
|-----------|-------------------|
| `MAX_NET_SAVING` | Maximize total savings over horizon |
| `FASTEST_BREAK_EVEN` | Minimize break-even month |

| Aspect | Detail |
|--------|--------|
| **Candidate Months** | 0 to min(36, horizon) by default |
| **Best For** | When old prepay penalties are significant |
| **Pros** | Optimal balance of timing vs. savings |
| **Cons** | May require waiting to refinance |

---

## 5. Product Templates

### 5.1 Template Structure

Each loan product template contains:

```typescript
interface ProductTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  category: 'MORTGAGE_RE' | 'REFINANCE';
  description: string;
  
  loan_limits: {
    max_ltv_pct?: number;        // Maximum loan-to-value (typically 75-85%)
    max_dti_pct?: number;        // Maximum debt-to-income (typically 45-55%)
  };
  
  term_rules: {
    min_term_months: number;     // Minimum 24-60 months
    max_term_months: number;     // Maximum 240-360 months
  };
  
  rates: {
    promo_fixed_months: number;  // Promotional period (6-60 months)
    promo_fixed_rate_pct: number; // Promo rate (5.2-7.8%)
    floating_reference_assumption_pct: number; // Base floating rate
    floating_margin_pct: number; // Bank margin (3.2-3.8%)
    reset_frequency_months: number; // Rate reset frequency
  };
  
  grace: {
    grace_principal_months: number; // Principal grace period (0-36 months)
  };
  
  fees: {
    origination_fee_pct?: number;
    appraisal_fee_vnd?: number;  // Typically 2-3 million VND
    refinance_processing_fee_pct?: number;
    insurance: {
      enabled_default: boolean;
      annual_pct?: number;
      basis: 'on_balance' | 'on_property_value';
    };
  };
  
  prepayment_penalty: {
    schedule: PrepaymentScheduleItem[]; // Tiered fee structure
    allow_partial_prepay: boolean;
    partial_prepay_min_vnd?: number;
  };
}
```

### 5.2 Available Templates (December 2025)

#### Mortgage Templates

| ID | Name | Promo Period | Promo Rate | Floating Margin | Grace Period |
|----|------|--------------|------------|-----------------|--------------|
| `market2025_mortgage_promo_6m` | Vay mua BĐS – LS ưu đãi 5.2% 6T | 6 months | 5.2% | 3.8% | 24 months |
| `market2025_mortgage_fixed_24m` | Vay mua BĐS – LS ưu đãi 6.5% 24T | 24 months | 6.5% | 3.5% | 36 months |
| `market2025_mortgage_fixed_60m` | Vay mua BĐS – LS ưu đãi 7.8% 60T | 60 months | 7.8% | 3.2% | 12 months |

#### Refinance Templates

| ID | Name | Promo Period | Promo Rate | Processing Fee | Grace Period |
|----|------|--------------|------------|----------------|--------------|
| `market2025_refinance_promo_12m` | Vay chuyển NH – ân hạn 12T | 12 months | 5.5% | 0.3% | 12 months |
| `market2025_refinance_fixed_24m` | Vay chuyển NH – ân hạn 24T | 24 months | 6.4% | 0.4% | 24 months |
| `market2025_refinance_low_margin_float` | Vay chuyển NH – ân hạn 6T | 6 months | 5.5% | 0.5% | 6 months |

### 5.3 Prepayment Penalty Schedule

Typical tiered structure (3-2-1-0):

| Period | Fee % |
|--------|-------|
| 0-12 months | 3% of remaining balance |
| 12-24 months | 2% of remaining balance |
| 24-36 months | 1% of remaining balance |
| 36+ months | 0% (no penalty) |

---

## 6. User Flows

### 6.1 Simplified Recommendation Flow (Current)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Mode Selection │────▶│  Needs + Strategy│────▶│  Recommendation │
│  (MORTGAGE/REFI)│     │      Form        │     │     Results      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

#### Step 1: Mode Selection
User chooses between:
- **Vay Mua BĐS** (New mortgage)
- **Chuyển Ngân Hàng** (Refinance)

#### Step 2: Needs + Strategy Input

**For Mortgage (MORTGAGE_RE):**
- Loan amount (tỷ đồng)
- Auto-calculated: minimum property value, required down payment
- Strategy selection:
  - **PAY_OFF_FAST**: Monthly income, existing debt → optimize for fastest payoff
  - **LOW_MONTHLY_SETTLE_LATER**: Settle after X years → minimize monthly payment

**For Refinance (REFINANCE):**
- Current loan details (balance, rate, remaining months, prepay fee)
- Strategy questions:
  - Hold duration (12/24/36/60 months)
  - Priority: reduce payment vs. maximize savings
  - Plan to settle early again?

#### Step 3: Recommendation Results
- **Best Package**: Optimal loan template + term + strategy
- **Key Metrics**: Monthly payment, total cost, payoff month
- **Stress Test**: Payment at +2%/+4% rate scenarios
- **Detailed Schedule**: Month-by-month amortization table
- **Reasons**: Why this package was recommended

### 6.2 Mortgage Strategy Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                  User selects: "PAY_OFF_FAST"                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Calculate recommended DTI (30-40% of income, default 35%)   │
│ Max affordable payment = Income × DTI - Existing Debt       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Find shortest term where:                                    │
│   stress_payment (+2%) ≤ max_affordable_payment             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Rank packages by:                                            │
│   1. Shortest payoff_month                                   │
│   2. Lowest total_cost_excl_principal                        │
│   3. Most stable stress payments                             │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│            User selects: "LOW_MONTHLY_SETTLE_LATER"          │
│                  (Settle after X years)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Set horizon = X × 12 months                                  │
│ Run M3_EXIT_PLAN strategy with CUSTOM exit at X years        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Rank packages by:                                            │
│   1. Lowest regular monthly payment (excluding payoff lump)  │
│   2. Lowest total cost until settlement                      │
│   3. Lowest prepayment penalty at exit                       │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Refinance Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                User provides current loan info               │
│     (Balance, Rate, Remaining months, Prepay fee %)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│        User selects strategy preferences:                    │
│   - Hold duration: 12/24/36/60 months                        │
│   - Priority: REDUCE_PAYMENT or MAX_TOTAL_SAVINGS            │
│   - Plan early settle: Yes/No                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Simulate all templates × terms using R1 strategy             │
│ Calculate: net_saving, break_even, monthly_reduction         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌─────────────────────────────────────┐
          │  Filter valid options:              │
          │  - New payment < current payment    │
          │  - Net saving > 0                   │
          │  - Break-even < horizon             │
          └─────────────────────────────────────┘
                              │
          ┌─────────────────┴─────────────────┐
          │                                    │
          ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│ Valid options    │              │ No valid options │
│ exist            │              │                  │
└──────────────────┘              └──────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│ Rank by priority │              │ Recommend:       │
│ + break-even     │              │ "Keep current    │
│ + exit fees      │              │  loan"           │
└──────────────────┘              └──────────────────┘
```

---

## 7. API Specifications

### 7.1 GET /api/simulator/templates

Fetches available product templates.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Optional: `MORTGAGE_RE` or `REFINANCE` |

**Response:**
```json
{
  "templates": [ProductTemplate[]],
  "count": 6
}
```

---

### 7.2 POST /api/simulator/simulate

Runs multi-strategy simulation for given templates.

**Request (V3 - Current):**
```json
{
  "template_ids": ["market2025_mortgage_promo_6m", "market2025_mortgage_fixed_24m"],
  "input": {
    "type": "MORTGAGE_RE",
    "currency": "VND",
    "start_date": "2025-01-01",
    "property_value_vnd": 2500000000,
    "down_payment_vnd": 500000000,
    "loan_amount_vnd": 2000000000,
    "term_months": 240,
    "horizon_months": 240,
    "repayment_method": "annuity",
    "include_insurance": false,
    "stress": { "floating_rate_bump_pct": 0 }
  }
}
```

**Response (Mortgage):**
```json
{
  "type": "MORTGAGE_RE",
  "results": [
    {
      "type": "MORTGAGE_RE",
      "template_id": "market2025_mortgage_promo_6m",
      "template_name": "Vay mua BĐS – LS ưu đãi 5.2% 6 tháng",
      "strategies": [
        {
          "strategy_id": "M1_MIN_PAYMENT",
          "strategy_label": "Thanh Toán Tối Thiểu",
          "result": {
            "closing_cash_needed_vnd": 513000000,
            "ltv_pct": 80,
            "totals": {
              "total_interest": 962000000,
              "total_fees": 13000000,
              "total_cost_excl_principal": 975000000
            },
            "metrics": {
              "monthly_payment_initial": 13500000,
              "payoff_month": null
            },
            "schedule": [/* 240 rows */]
          }
        },
        {
          "strategy_id": "M2_EXTRA_PRINCIPAL",
          "strategy_label": "Trả Thêm Gốc Hàng Tháng",
          "result": { /* ... */ }
        },
        {
          "strategy_id": "M3_EXIT_PLAN",
          "strategy_label": "Tất Toán Sớm",
          "result": {
            "metrics": { "payoff_month": 6 }
          }
        }
      ]
    }
  ],
  "count": 1
}
```

---

### 7.3 POST /api/simulator/recommend

Intelligent recommendation based on user's needs and strategy.

**Request (Mortgage - PAY_OFF_FAST):**
```json
{
  "mode": "MORTGAGE_RE",
  "loan_amount_vnd": 2000000000,
  "min_property_value_vnd": 2941176470,
  "required_down_payment_vnd": 500000000,
  "strategy": {
    "type": "PAY_OFF_FAST",
    "monthly_income_vnd": 50000000,
    "existing_debt_monthly_vnd": 5000000
  }
}
```

**Request (Mortgage - LOW_MONTHLY_SETTLE_LATER):**
```json
{
  "mode": "MORTGAGE_RE",
  "loan_amount_vnd": 2000000000,
  "min_property_value_vnd": 2941176470,
  "required_down_payment_vnd": 500000000,
  "strategy": {
    "type": "LOW_MONTHLY_SETTLE_LATER",
    "settle_after_years": 3
  }
}
```

**Request (Refinance):**
```json
{
  "mode": "REFINANCE",
  "remaining_balance_vnd": 1500000000,
  "current_rate_pct": 10.5,
  "remaining_months": 180,
  "old_prepay_fee_pct": 2,
  "hold_duration_months": 36,
  "priority": "REDUCE_PAYMENT",
  "plan_early_settle": false
}
```

**Response:**
```json
{
  "category": "MORTGAGE_RE",
  "best": {
    "templateId": "market2025_mortgage_promo_6m",
    "templateName": "Vay mua BĐS – LS ưu đãi 5.2% 6 tháng",
    "termMonths": 120,
    "strategyId": "M1_MIN_PAYMENT",
    "strategyLabel": "Thanh Toán Tối Thiểu",
    "totalCost": 542000000,
    "totalInterest": 530000000,
    "maxMonthlyPayment": 18500000,
    "avgFirst12MonthsPayment": 15200000,
    "promoEndMonth": 6,
    "promoRatePct": 5.2,
    "payoffMonth": 120,
    "dtiActual": 0.35,
    "stressPayments": {
      "base": 18500000,
      "plus2": 21200000,
      "plus4": 24100000
    },
    "reasons": [
      "Phí tất toán sớm thấp/giảm nhanh",
      "Biên độ lãi thả nổi thấp 3.80%",
      "Không ân hạn gốc giúp trả nhanh hơn"
    ],
    "schedule": [/* full schedule */]
  },
  "alternatives": [/* up to 2 more packages */],
  "explanations": [
    "Kỳ hạn đề xuất: 10 năm • Tỷ lệ nợ/thu nhập ~35%",
    "Tháng trả xong dự kiến: tháng 120",
    "Tổng chi phí vay: 542 triệu"
  ],
  "recommendedTermMonths": 120,
  "recommendedDTI": 0.35
}
```

---

## 8. Calculation Engine Details

### 8.1 Core Functions

| Function | Purpose |
|----------|---------|
| `simulateLoanSchedule()` | Generic schedule generator for any loan |
| `simulateMortgagePurchase()` | Full mortgage simulation with strategy |
| `simulateRefinance()` | Complete refinance comparison |
| `simulateMortgageAllStrategies()` | Run M1/M2/M3 for a template |
| `simulateRefinanceAllStrategies()` | Run R1/R2/R3 for a template |
| `findOptimalRefinanceTiming()` | R3 optimization algorithm |

### 8.2 Rate Timeline

The engine builds a rate timeline for each loan:

```
Month 1-6:   Promo rate (5.2%)
Month 7+:    Floating = Base (5.0%) + Margin (3.8%) + Stress (0/2/4%)
```

### 8.3 Payment Recalculation

Payments are recalculated at:
1. Start of loan (month 1)
2. End of promotional period (rate reset)
3. End of grace period (principal payments begin)

### 8.4 Break-even Calculation

```
For each month m in 1..horizon_months:
  baseline_cum_cost[m] = sum of (interest + fees + insurance) for old loan
  refinance_cum_cost[m] = 
    old payments before refinance +
    switching costs (old prepay fee + new upfront fees) +
    new loan costs after refinance

  break_even_month = first m where refinance_cum_cost[m] <= baseline_cum_cost[m]
```

### 8.5 Net Savings Formula

```
net_saving = baseline_total_cost - refinance_total_cost

refinance_total_cost = 
  old_payments_before_refinance +
  old_prepayment_fee +
  new_loan_upfront_fees +
  new_loan_interest_and_fees
```

---

## 9. UI/UX Specifications

### 9.1 Design System

**Brand Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | #4DC614 (Leadity Green) | CTAs, active states |
| `primary-dark` | #45b312 | Hover states |
| `dark-darker` | #1a1a1a | Text, headings |
| `leadity-gray` | #6b7280 | Secondary text |
| `status-warning` | #f59e0b | Warnings, stress indicators |
| `status-error` | #ef4444 | Errors, high stress |

**Typography:**
- Headings: Bold, 1.25-2rem
- Body: Regular, 0.875-1rem
- Labels: Medium, 0.75-0.875rem

### 9.2 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, sticky CTAs |
| Tablet | 640-1023px | Single column, larger inputs |
| Desktop | ≥ 1024px | Centered card, fixed header |

### 9.3 Key Components

| Component | Purpose |
|-----------|---------|
| `NeedsStrategyStep` | Combined input form for needs + strategy |
| `RecommendationStep` | Display best package + alternatives |
| `MortgageResultCard` | Detailed mortgage result display |
| `RefinanceResultCard` | Detailed refinance result display |
| `DetailedScheduleTable` | Month-by-month amortization |
| `MetricBox` | Key metric display with color coding |

### 9.4 Input Patterns

- **Amount inputs**: Quick-select buttons + free input
- **Strategy selection**: Card-based radio with expandable details
- **Toggle options**: Pill-style toggles with icons
- **Number inputs**: Native number with increment buttons

---

## 10. Business Logic Rules

### 10.1 Mortgage Recommendations

**PAY_OFF_FAST Strategy:**
1. Calculate max affordable payment = Income × 35% - Existing Debt
2. Filter packages where stress_payment (+2%) ≤ max affordable
3. Rank by: shortest payoff → lowest total cost → most stable stress
4. If no affordable options: show closest option + warning

**LOW_MONTHLY_SETTLE_LATER Strategy:**
1. Set horizon = settle_after_years × 12
2. Use M3_EXIT_PLAN with CUSTOM exit month
3. Rank by: lowest regular monthly → lowest total cost → lowest exit fee

### 10.2 Refinance Recommendations

**Validation Filters:**
1. New monthly payment must be lower than current
2. Net savings must be positive
3. Break-even must occur within horizon

**Priority-Based Ranking:**
- **REDUCE_PAYMENT**: Sort by lowest payment → fastest break-even
- **MAX_TOTAL_SAVINGS**: Sort by highest net savings → fastest break-even

**Early Settle Preference:**
- If user plans to settle early: prefer lower exit fees at 24 months

### 10.3 DTI Guidelines

| DTI Range | Assessment |
|-----------|------------|
| 0-30% | Safe zone |
| 30-40% | **Recommended range** (default: 35%) |
| 40-50% | Acceptable, higher risk |
| 50%+ | Warning: may exceed bank limits |

---

## 11. Data Model Constraints

### 11.1 Input Validation (Zod Schemas)

```typescript
// Mortgage Input
loan_amount_vnd: z.number().positive()
term_months: z.number().int().min(12).max(360)
horizon_months: z.number().int().min(1)
stress.floating_rate_bump_pct: z.union([0, 2, 4])

// Refinance Input
old_remaining_balance_vnd: z.number().positive()
old_current_rate_pct: z.number().positive()
new_term_months: z.number().int().min(12).max(360)
refinance_month_index: z.number().int().min(0)
```

### 11.2 Template Constraints

```typescript
// Term Rules
min_term_months: 24-60 months (varies by template)
max_term_months: 240-360 months (varies by template)

// LTV Limits
max_ltv_pct: 75-85% (varies by template)

// DTI Limits
max_dti_pct: 45-55% (varies by template)
```

---

## 12. Testing Requirements

### 12.1 Unit Tests (Loan Engine)

| Test Category | Coverage |
|---------------|----------|
| M1 Strategy | Correct scheduled payments |
| M2 Strategy | Extra principal reduces total interest |
| M3 Strategy | Payoff at correct milestone |
| R1 Strategy | Refinance at month 0, min payment |
| R2 Strategy | Extra principal reduces cost vs R1 |
| R3 Strategy | Optimal month maximizes savings |
| Break-even | Cumulative comparison correct |
| Fee calculations | Upfront, recurring, prepayment |
| Rate timeline | Promo → floating transitions |

### 12.2 Integration Tests (API)

| Endpoint | Test Cases |
|----------|------------|
| GET /templates | Filter by category |
| POST /simulate | V3 request format |
| POST /recommend | Both strategies, edge cases |

### 12.3 E2E Tests

| Flow | Validation |
|------|------------|
| Mortgage PAY_OFF_FAST | DTI calculation, term selection |
| Mortgage LOW_MONTHLY_SETTLE_LATER | Exit summary, schedule |
| Refinance REDUCE_PAYMENT | Net savings, break-even |
| No valid options | Fallback message displayed |

---

## 13. Deployment Configuration

### 13.1 Environment Variables

```bash
# No external APIs required - all calculations local
# Optional: Analytics, error tracking
```

### 13.2 Build Order

```bash
# 1. Build loan-engine package
cd packages/loan-engine
npm install
npm run build

# 2. Build frontend
cd apps/web
npm install
npm run build
npm start
```

### 13.3 Supported Platforms

| Platform | Configuration |
|----------|---------------|
| Vercel | vercel.json |
| Railway | nixpacks.toml, railway.json |
| Fly.io | fly.toml, Dockerfile |

---

## 14. Future Roadmap

### 14.1 Near-term Enhancements

- [ ] Real bank product data integration
- [ ] User account + saved simulations
- [ ] PDF export of simulation results
- [ ] Comparison table for multiple packages

### 14.2 Medium-term Features

- [ ] Daily interest calculation mode (daily_365)
- [ ] Variable rate schedules for old loan
- [ ] Fee financing options
- [ ] Multi-currency support

### 14.3 Long-term Vision

- [ ] AI-powered rate predictions
- [ ] Integration with bank application portals
- [ ] Credit score impact modeling
- [ ] Market rate monitoring alerts

---

## 15. Glossary

| Term | Vietnamese | Definition |
|------|------------|------------|
| LTV | Tỷ lệ vay/giá | Loan-to-Value ratio |
| DTI | Tỷ lệ nợ/thu nhập | Debt-to-Income ratio |
| Promo Rate | Lãi ưu đãi | Promotional fixed interest rate |
| Floating Rate | Lãi thả nổi | Variable rate based on market |
| Grace Period | Ân hạn gốc | Period of interest-only payments |
| Prepayment Fee | Phí tất toán sớm | Penalty for early payoff |
| Break-even | Hoà vốn | Point where savings exceed costs |
| Refinance | Chuyển ngân hàng | Switch loan to another bank |
| Annuity | Trả đều | Equal monthly payments |
| Equal Principal | Trả gốc đều | Equal principal, decreasing interest |

---

## 16. Appendices

### A. Sample Amortization Row

```typescript
interface ScheduleRow {
  month: 1,
  date: "2025-01-01",
  rate_annual_pct: 5.2,
  balance_start: 2000000000,
  interest: 8666667,          // 2B × 5.2% / 12
  principal_scheduled: 0,      // Grace period
  extra_principal: 0,
  fees: 0,
  insurance: 0,
  payment_total: 8666667,
  balance_end: 2000000000,
  prepayment_penalty: 0,
  is_payoff_month: false
}
```

### B. Prepayment Schedule Example

```typescript
prepayment_penalty: {
  schedule: [
    { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
    { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
    { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
    { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 }
  ],
  allow_partial_prepay: true,
  partial_prepay_min_vnd: 10000000  // 10 million minimum
}
```

### C. Stress Test Calculation

```typescript
// Base payment at month 7 (after promo)
const baseRate = 5.0 + 3.8; // = 8.8%
const basePayment = calculatePMT(balance, baseRate/12, remainingMonths);

// Stress scenarios
const plus2Payment = calculatePMT(balance, (baseRate+2)/12, remainingMonths);
const plus4Payment = calculatePMT(balance, (baseRate+4)/12, remainingMonths);

stressPayments = {
  base: basePayment,    // ~18.5M
  plus2: plus2Payment,  // ~21.2M (+14.5%)
  plus4: plus4Payment   // ~24.1M (+30.3%)
}
```

---

**Document Version Control:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Claude | Initial comprehensive spec |

