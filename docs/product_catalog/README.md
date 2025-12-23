# Loan Product Catalog

This directory contains examples and explanations of loan products in the system.

## Product Categories

1. **HOME_PURCHASE** - Loans for buying new homes
2. **REFINANCE** - Refinancing existing mortgages
3. **REPAIR_BUILD** - Home renovation and construction loans

---

## Understanding Product Constraints

Each loan product has **hard constraints** (strict eligibility rules) and **soft preferences** (scoring weights).

### Hard Constraints

These are **must-meet requirements**. If an application violates any hard constraint, the product is automatically rejected.

#### `max_ltv` (Maximum Loan-to-Value Ratio)

**Formula**: `LTV = Loan Amount / Collateral Value`

**Example**:
- Loan requested: 500M VND
- Collateral value: 800M VND
- LTV = 500M / 800M = 0.625 (62.5%)

If product has `max_ltv: 0.70`, this application **passes** (62.5% < 70%)

---

#### `max_dsr` (Maximum Debt Service Ratio)

**Formula**: `DSR = (New Loan Payment + Existing Debts) / Total Income`

**Example**:
- Monthly income: 30M VND
- Existing debt payments: 2M VND
- Estimated new loan payment: 3.5M VND
- DSR = (3.5M + 2M) / 30M = 0.183 (18.3%)

If product has `max_dsr: 0.50`, this application **passes** (18.3% < 50%)

**Why it matters**: Banks use DSR to ensure borrowers can afford repayments

---

#### `min_income_monthly` (Minimum Monthly Income)

Minimum gross monthly income required to qualify for the product.

**Example**:
- Applicant income: 25M VND/month
- Product requirement: `min_income_monthly: 20000000`
- Result: **Passes** (25M ≥ 20M)

---

#### `max_tenor_months` (Maximum Loan Tenor)

Maximum loan duration in months.

**Example**:
- Applicant prefers: 180 months (15 years)
- Product allows: `max_tenor_months: 240` (20 years)
- Result: **Passes** (180 ≤ 240)

---

#### `allowed_collateral_types`

Types of collateral accepted for the loan.

**Options**:
- `HOUSE` - Detached house
- `CONDO` - Condominium/apartment
- `LAND` - Land only
- `COMMERCIAL` - Commercial property

**Example**:
```json
"allowed_collateral_types": ["HOUSE", "CONDO"]
```
This product accepts houses and condos, but not land or commercial properties.

---

#### `geo_allowed` (Geographic Locations)

Cities/provinces where the product is available.

**Common codes**:
- `HCM` - Ho Chi Minh City
- `HN` - Hanoi
- `DN` - Da Nang
- `BD` - Binh Duong
- `HP` - Hai Phong
- `CT` - Can Tho
- `QN` - Quang Ninh

**Example**:
```json
"geo_allowed": ["HCM", "HN", "DN"]
```
This product is only available in the three major cities.

---

### Soft Preferences

These affect **scoring and ranking** but don't disqualify applications.

#### Scoring Weights

```json
"soft": {
  "pref_fixed_months_weight": 0.3,
  "pref_fast_sla_weight": 0.2,
  "pref_low_fee_weight": 0.2
}
```

**Interpretation**:
- This product values **long fixed-rate period** (30% weight)
- Fast approval SLA is moderately important (20%)
- Low fees are moderately important (20%)

These weights determine the product's **preference score** in recommendations.

---

## Interest Rate Structure

### Two-Stage Rate Model

Most products use a **fixed-then-floating** rate structure:

```json
{
  "rate_fixed_months": 24,
  "rate_fixed": 7.5,
  "floating_margin": 2.5,
  "reference_rate_name": "12M deposit average"
}
```

**How it works**:

**Months 1-24** (Fixed Period):
- Interest rate: **7.5% per year** (fixed)
- Payment is stable and predictable

**Month 25+** (Floating Period):
- Interest rate: **Reference Rate + 2.5%**
- If reference rate is 5%, total rate = 5% + 2.5% = 7.5%
- If reference rate increases to 6%, total rate = 6% + 2.5% = 8.5%

**Example Monthly Payment**:
- Loan: 500M VND
- Tenor: 180 months (15 years)
- Fixed period payment: ~3.5M VND/month
- After rate reset: Could increase to ~4.2M if rates rise 2%

---

## Sample Product: Vietcombank Home Purchase

```json
{
  "name": "Vay mua nhà ưu đãi cá nhân",
  "purpose": "HOME_PURCHASE",
  "description": "Home purchase loan with preferential rates for first-time buyers",

  "rate_fixed_months": 24,
  "rate_fixed": 7.5,
  "floating_margin": 2.5,
  "reference_rate_name": "12M deposit average",

  "sla_days_estimate": 15,

  "constraints_json": {
    "hard": {
      "max_ltv": 0.70,
      "max_dsr": 0.50,
      "min_income_monthly": 15000000,
      "max_tenor_months": 240,
      "allowed_collateral_types": ["HOUSE", "CONDO"],
      "geo_allowed": ["HCM", "HN", "DN", "BD", "HP"]
    },
    "soft": {
      "pref_fixed_months_weight": 0.3,
      "pref_fast_sla_weight": 0.2,
      "pref_low_fee_weight": 0.2
    }
  }
}
```

### Who This Product Suits

**✅ Good Fit**:
- Salaried employees earning 15M+ VND/month
- Buying house or condo in major cities
- LTV under 70% (at least 30% down payment)
- Existing debts below 50% of income
- Want 2-year rate stability

**❌ Not a Fit**:
- Income below 15M VND/month
- Buying land (not accepted as collateral)
- Location outside HCM/HN/DN/BD/HP
- Need LTV above 70%
- Want longer fixed rate period

---

## Product Comparison Example

### Scenario
- Loan: 400M VND
- Collateral: 600M Condo (LTV = 66.7%)
- Income: 25M VND/month
- Existing debts: 1M VND/month
- Location: HCM

### Product A: Vietcombank (24-month fixed)
- **Fixed Rate**: 7.5% for 24 months
- **Estimated Payment**: 3.2M VND/month
- **SLA**: 15 days
- **Fees**: 1% origination = 4M VND
- **Fit Score**: 85/100

### Product B: ACB Quick (6-month fixed)
- **Fixed Rate**: 8.2% for 6 months
- **Estimated Payment**: 3.3M VND/month
- **SLA**: 3 days (fastest!)
- **Fees**: 0.7% origination = 2.8M VND
- **Fit Score**: 78/100

**Why Vietcombank scores higher**:
- Longer rate stability (24 vs 6 months)
- Slightly lower rate (7.5% vs 8.2%)
- Better cost score over 3-5 year horizon

**Why choose ACB**:
- Need fast approval (3 vs 15 days)
- Lower upfront fees
- Willing to accept rate reset risk

---

## Document Requirements

Different products require different documents based on **income type**:

### Salary Income
- National ID card / Passport
- Employment contract / Appointment letter
- Recent payslips (3-6 months)
- Bank statements showing salary deposits
- Tax code / Tax returns

### Business Income
- National ID card / Passport
- Business registration certificate
- Tax returns (1-2 years)
- Business bank statements
- Financial statements (if applicable)

### Rental Income
- National ID card / Passport
- Property ownership documents
- Rental/lease agreements
- Tax declarations for rental income
- Bank statements showing rental payments

### Mixed Income
If you have multiple income sources, prepare documents for all sources. The bank will sum all verified income streams.

---

## Approval Process

1. **Application Submission**
   - Submit complete application with documents
   - Status: DRAFT → SUBMITTED

2. **Initial Screening** (1-2 days)
   - Document completeness check
   - Basic eligibility verification
   - Status: SUBMITTED → PROCESSING

3. **Detailed Assessment** (varies by product SLA)
   - Credit bureau check (CIC report)
   - Income verification
   - Collateral appraisal
   - Debt calculation

4. **Decision** (End of SLA period)
   - Status: PROCESSING → APPROVED or REJECTED
   - If approved: Prepare for disbursement
   - If rejected: Review stuck_reasons for details

---

## Common Rejection Reasons

### `MIN_INCOME`
Your monthly income is below the product's minimum requirement.

**Solution**:
- Apply for products with lower income requirements
- Include additional income sources (rental, business)
- Add a co-borrower

### `MAX_LTV`
Your loan amount is too high relative to collateral value.

**Solution**:
- Increase down payment (reduce loan amount)
- Use higher-valued collateral
- Apply for products with higher max_ltv

### `MAX_DSR`
Your total debt payments exceed the allowed percentage of income.

**Solution**:
- Pay off existing debts before applying
- Increase income (add co-borrower)
- Reduce loan amount (longer tenor = lower payment)

### `COLLATERAL_TYPE`
Your collateral type is not accepted by this product.

**Solution**:
- Apply for products that accept your collateral type
- Use different collateral if available

### `GEO_RESTRICTION`
Property location is not in the product's service area.

**Solution**:
- Apply for products available in your area
- Consider other properties in eligible locations

### `MAX_TENOR`
Your preferred loan duration exceeds the product's maximum.

**Solution**:
- Reduce tenor to within product limits
- Apply for products with longer maximum tenor

---

## Tips for Getting Best Recommendations

1. **Accurate Information**
   - Provide complete income details
   - Include all existing debts
   - Use realistic collateral valuation

2. **Multiple Income Sources**
   - Include salary + business + rental if applicable
   - Increases approval chances and scores

3. **Lower LTV**
   - Larger down payment = more product options
   - Better approval scores

4. **Manage Existing Debt**
   - Pay off high-interest debts first
   - Lower DSR = higher scores

5. **Location Matters**
   - Major cities (HCM, HN) have most product options
   - Secondary cities have fewer choices

6. **Document Preparation**
   - Have all documents ready before applying
   - Speeds up approval process
   - Reduces risk of rejection

---

## Recommendation Scoring Explained

The system scores each product on three dimensions:

### 1. Approval Score (0-100)
**Weight: 45%**

Based on how comfortably you meet hard constraints:
- DSR well below limit: Higher score
- LTV well below limit: Higher score
- Income well above minimum: Higher score

**Example**:
- DSR 30% vs 50% limit = 90 points (good margin)
- DSR 48% vs 50% limit = 60 points (tight)

### 2. Cost Score (0-100)
**Weight: 35%**

Based on estimated total costs:
- Lower monthly payment: Higher score
- Lower stress scenario payment: Higher score
- Lower total fees: Higher score

**Example**:
- Payment 3M vs income 30M = 95 points (affordable)
- Payment 10M vs income 30M = 50 points (high burden)

### 3. Preference Score (0-100)
**Weight: 20%**

Based on product features:
- Longer fixed rate period
- Faster SLA
- Lower fees

**Example**:
- 48-month fixed rate = 95 points
- 6-month fixed rate = 60 points

### Final Fit Score

`Fit Score = 0.45 × Approval + 0.35 × Cost + 0.20 × Preference`

**Approval Buckets**:
- **HIGH** (75-100): Strong candidate, high approval likelihood
- **MEDIUM** (50-75): Acceptable candidate, moderate approval chance
- **LOW** (0-50): Weak candidate, consider improving profile

---

## Need Help?

For questions about:
- Product eligibility: Check hard constraints
- Cost estimates: Use recommendation API
- Approval chances: Review fit_score and approval_bucket
