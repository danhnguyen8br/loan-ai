# API Contracts & Examples

This directory contains examples of API requests and responses for the Loan AI Recommender system.

## Base URL

- **Local Development**: `http://localhost:8000/api/v1`
- **Production**: TBD

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Loan Products](#loan-products)
3. [Applications](#applications)
4. [Recommendations](#recommendations)

---

## Authentication Endpoints

### Register New User

**Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Nguyen Van A",
  "phone": "0901234567"
}
```

**Response** (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "phone": "0901234567",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

### Login

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### Get Current User

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "phone": "0901234567",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

## Loan Products

### List All Products

**Endpoint**: `GET /products`

**Query Parameters**:
- `purpose` (optional): Filter by purpose (HOME_PURCHASE, REFINANCE, REPAIR_BUILD)

**Example**: `GET /products?purpose=HOME_PURCHASE`

**Response** (200 OK):
```json
[
  {
    "id": "prod-uuid-1",
    "bank_id": "bank-uuid-1",
    "name": "Vay mua nhà ưu đãi cá nhân",
    "purpose": "HOME_PURCHASE",
    "description": "Home purchase loan with preferential rates",
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
        "geo_allowed": ["HCM", "HN", "DN"]
      },
      "soft": {
        "pref_fixed_months_weight": 0.3,
        "pref_fast_sla_weight": 0.2,
        "pref_low_fee_weight": 0.2
      }
    },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### Get Product by ID

**Endpoint**: `GET /products/{product_id}`

**Response**: Same structure as individual product in list above

---

## Applications

### Create Application

**Endpoint**: `POST /applications`

**Request**:
```json
{
  "borrower_name": "Nguyen Van A",
  "borrower_email": "nguyenvana@example.com",
  "borrower_phone": "0901234567",
  "purpose": "HOME_PURCHASE",
  "loan_amount_requested": 500000000,
  "tenor_months_preferred": 180,
  "geo_location": "HCM",
  "incomes": [
    {
      "source_type": "SALARY",
      "amount_monthly": 30000000,
      "employer_name": "Tech Company Ltd",
      "years_at_current": 3
    }
  ],
  "debts": [
    {
      "debt_type": "CREDIT_CARD",
      "monthly_payment": 2000000,
      "outstanding_balance": 10000000
    }
  ],
  "collaterals": [
    {
      "collateral_type": "CONDO",
      "appraised_value": 800000000,
      "location": "District 1, HCM City",
      "ownership_status": "OWNED"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": "app-uuid-1",
  "borrower_name": "Nguyen Van A",
  "borrower_email": "nguyenvana@example.com",
  "borrower_phone": "0901234567",
  "purpose": "HOME_PURCHASE",
  "loan_amount_requested": 500000000,
  "tenor_months_preferred": 180,
  "geo_location": "HCM",
  "status": "DRAFT",
  "stuck_reasons": [],
  "incomes": [
    {
      "id": "income-uuid-1",
      "application_id": "app-uuid-1",
      "source_type": "SALARY",
      "amount_monthly": 30000000,
      "employer_name": "Tech Company Ltd",
      "years_at_current": 3,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "debts": [
    {
      "id": "debt-uuid-1",
      "application_id": "app-uuid-1",
      "debt_type": "CREDIT_CARD",
      "monthly_payment": 2000000,
      "outstanding_balance": 10000000,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "collaterals": [
    {
      "id": "collateral-uuid-1",
      "application_id": "app-uuid-1",
      "collateral_type": "CONDO",
      "appraised_value": 800000000,
      "location": "District 1, HCM City",
      "ownership_status": "OWNED",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

### Get Application by ID

**Endpoint**: `GET /applications/{application_id}`

**Response**: Same structure as create response

---

### Update Application

**Endpoint**: `PUT /applications/{application_id}`

**Request** (partial update):
```json
{
  "status": "SUBMITTED",
  "borrower_phone": "0909876543"
}
```

**Response** (200 OK): Updated application object

---

### Compute Application Metrics

**Endpoint**: `POST /applications/{application_id}/metrics`

**Response** (200 OK):
```json
{
  "dsr": 0.0667,
  "ltv": 0.625,
  "dti": 0.0667,
  "total_income": 30000000,
  "total_debt_payment": 2000000,
  "total_collateral_value": 800000000
}
```

**Metric Definitions**:
- **DSR** (Debt Service Ratio): Total debt payments / Total income
- **LTV** (Loan-to-Value): Requested loan amount / Collateral value
- **DTI** (Debt-to-Income): Total debt payments / Total income

---

## Recommendations

### Generate Recommendations

**Endpoint**: `POST /recommendations/generate/{application_id}`

**Response** (200 OK):
```json
{
  "id": "rec-run-uuid-1",
  "application_id": "app-uuid-1",
  "recommended": [
    {
      "product_id": "prod-uuid-1",
      "product_name": "Vay mua nhà ưu đãi",
      "bank_name": "Vietcombank",
      "fit_score": 85.5,
      "approval_score": 75.0,
      "cost_score": 88.0,
      "preference_score": 85.0,
      "approval_bucket": "HIGH",
      "estimated_costs": {
        "month1_payment": 3500000,
        "year1_total": 45000000,
        "total_3y": 140000000,
        "total_5y": 240000000,
        "stress_max_monthly": 4200000
      },
      "why_fit": [
        "DSR at 45% with 5% margin below 50% limit",
        "LTV at 62.5% comfortably below 70% limit",
        "Income 15M above minimum requirement"
      ],
      "risks": [
        "Rate reset after 24 months could increase payment by 15%"
      ],
      "rate_details": {
        "fixed_months": 24,
        "fixed_rate": 7.5,
        "floating_margin": 2.5
      }
    }
  ],
  "rejected": [
    {
      "product_id": "prod-uuid-2",
      "product_name": "Premium Home Loan",
      "bank_name": "VietinBank",
      "reason_code": "MIN_INCOME",
      "reason_detail": "Monthly income 30M below minimum requirement of 50M"
    }
  ],
  "application_snapshot": {
    "loan_amount": 500000000,
    "tenor_months": 180,
    "purpose": "HOME_PURCHASE",
    "dsr": 0.0667,
    "ltv": 0.625
  },
  "next_steps": [
    "Review recommended products and their terms",
    "Prepare required documents based on income type",
    "Contact bank for formal application"
  ],
  "created_at": "2025-01-15T10:35:00Z"
}
```

---

### Get Recommendation by ID

**Endpoint**: `GET /recommendations/{recommendation_id}`

**Response**: Same structure as generate response

---

## Error Responses

All endpoints may return error responses in the following format:

### 400 Bad Request
```json
{
  "detail": "Email already registered",
  "message": "Validation failed"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials",
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "detail": "Application not found"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ],
  "message": "Validation failed"
}
```

### 500 Internal Server Error
```json
{
  "detail": "An unexpected error occurred",
  "message": "Internal server error"
}
```

---

## Rate Limiting

TBD - Rate limiting not yet implemented

## Versioning

Current API version: **v1**

The API version is included in the URL path: `/api/v1/...`
