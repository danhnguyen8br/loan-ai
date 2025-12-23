# 🚀 Quick Testing Guide

## Application URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## Test Credentials

```
Email: test@example.com
Password: test123456
```

OR

```
Email: admin@loanai.vn
Password: admin123456
```

## Pre-filled Application Form

The loan application form now comes **pre-filled with realistic test data** for faster testing:

### Step 1: Loan Details (Pre-filled)
- **Purpose**: Home Purchase
- **Loan Amount**: 0.5 billion VND (500 million VND)
- **Tenor**: 180 months (15 years)
- **Location**: Ho Chi Minh City

### Step 2: Income Sources (Pre-filled)
- **Source**: SALARY
- **Monthly Income**: 30 million VND/month

### Step 3: Debts
- Optional - can skip or add more

### Step 4: Collateral (Pre-filled)
- **Type**: CONDO
- **Value**: 0.8 billion VND (800 million VND)
- **Location**: Optional

## Improved Input Units

All monetary inputs have been converted to more readable units:

| Field | Old Unit | New Unit | Example |
|-------|----------|----------|---------|
| Loan Amount | VND | Billion VND | 0.5 = 500 million |
| Income | VND | Million VND | 30 = 30 million/month |
| Debt Payment | VND | Million VND | 2 = 2 million/month |
| Debt Balance | VND | Billion VND | 0.01 = 10 million |
| Collateral Value | VND | Billion VND | 0.8 = 800 million |

## Quick Test Flow

1. **Visit**: http://localhost:3001
2. **Click**: "Apply for Loan" button
3. **Review**: Pre-filled data in Step 1
4. **Click**: "Next" through all 4 steps (data is already filled!)
5. **Click**: "Submit Application"
6. **See**: 5 personalized loan recommendations with:
   - Fit scores (64-70%)
   - Monthly payments
   - Total costs (1, 3, 5 year projections)
   - Approval predictions (LOW/MEDIUM/HIGH)
   - Why each product fits
   - Risk considerations

## Expected Results

You should receive recommendations from:
- BIDV HOME (Fit Score: ~70%)
- VietinBank Gold (Fit Score: ~69%)
- Techcombank Home Plus (Fit Score: ~68%)
- Vietcombank (Fit Score: ~67%)
- TPBank Home Fast (Fit Score: ~64%)

All with MEDIUM approval bucket since:
- DSR: 0% (no debt)
- LTV: 62.5% (within 70% limit)
- Income: 30M VND/month (meets minimums)

## Customizing Test Data

You can easily modify the pre-filled values:

- **Loan Amount**: Change from 0.5 to any number (in billions)
- **Income**: Add more sources or change amount (in millions)
- **Debts**: Add credit cards, loans (payment in millions, balance in billions)
- **Collateral**: Change value or add multiple properties (in billions)

## Tips

- All inputs support decimal places (e.g., 0.05 billion = 50 million)
- Step increment buttons work with the new units
- Helper text shows conversion examples
- Validation ensures positive numbers and required fields
