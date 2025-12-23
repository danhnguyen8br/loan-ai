"""
Integration tests for recommendation endpoints
"""
import pytest
from fastapi import status


@pytest.fixture
def complete_application(client):
    """Create a complete application for testing recommendations"""
    app_data = {
        "borrower_name": "Nguyen Van B",
        "borrower_email": "nguyenvanb@example.com",
        "borrower_phone": "0912345678",
        "purpose": "HOME_PURCHASE",
        "loan_amount_requested": 400000000,
        "tenor_months_preferred": 180,
        "geo_location": "HCM",
        "incomes": [
            {
                "source_type": "SALARY",
                "amount_monthly": 25000000,
                "employer_name": "Software Company",
                "years_at_current": 5
            }
        ],
        "debts": [
            {
                "debt_type": "CREDIT_CARD",
                "monthly_payment": 1000000,
                "outstanding_balance": 5000000
            }
        ],
        "collaterals": [
            {
                "collateral_type": "CONDO",
                "appraised_value": 600000000,
                "location": "District 2, HCM",
                "ownership_status": "OWNED"
            }
        ]
    }
    response = client.post("/api/v1/applications", json=app_data)
    return response.json()


def test_generate_recommendations(client, complete_application, test_loan_product):
    """Test generating recommendations for an application"""
    app_id = complete_application["id"]

    response = client.post(f"/api/v1/recommendations/generate/{app_id}")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "id" in data  # Recommendation run ID
    assert "application_id" in data
    assert "recommended" in data
    assert "rejected" in data
    assert "application_snapshot" in data


def test_recommendations_structure(client, complete_application, test_loan_product):
    """Test that recommendation response has correct structure"""
    app_id = complete_application["id"]
    response = client.post(f"/api/v1/recommendations/generate/{app_id}")
    data = response.json()

    # Check recommended products structure
    if len(data["recommended"]) > 0:
        rec = data["recommended"][0]
        assert "product_id" in rec
        assert "product_name" in rec
        assert "bank_name" in rec
        assert "fit_score" in rec
        assert "approval_bucket" in rec
        assert "estimated_costs" in rec
        assert "why_fit" in rec
        assert "risks" in rec

        # Check estimated costs structure
        costs = rec["estimated_costs"]
        assert "month1_payment" in costs
        assert "year1_total" in costs
        assert "total_3y" in costs
        assert "total_5y" in costs
        assert "stress_max_monthly" in costs

    # Check rejected products structure
    if len(data["rejected"]) > 0:
        rej = data["rejected"][0]
        assert "product_id" in rej
        assert "product_name" in rej
        assert "bank_name" in rej
        assert "reason_code" in rej
        assert "reason_detail" in rej


def test_recommendations_scoring(client, complete_application, test_loan_product):
    """Test that recommendations have valid scoring"""
    app_id = complete_application["id"]
    response = client.post(f"/api/v1/recommendations/generate/{app_id}")
    data = response.json()

    for rec in data["recommended"]:
        # Fit score should be between 0 and 100
        assert 0 <= rec["fit_score"] <= 100

        # Approval bucket should be valid
        assert rec["approval_bucket"] in ["LOW", "MEDIUM", "HIGH"]

        # Estimated costs should be positive
        costs = rec["estimated_costs"]
        assert costs["month1_payment"] > 0
        assert costs["year1_total"] > 0
        assert costs["stress_max_monthly"] >= costs["month1_payment"]


def test_get_recommendation_by_id(client, complete_application, test_loan_product):
    """Test retrieving a recommendation by ID"""
    app_id = complete_application["id"]

    # Generate recommendation
    gen_response = client.post(f"/api/v1/recommendations/generate/{app_id}")
    rec_id = gen_response.json()["id"]

    # Get recommendation
    response = client.get(f"/api/v1/recommendations/{rec_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == rec_id
    assert "recommended" in data
    assert "rejected" in data


def test_get_recommendation_not_found(client):
    """Test getting non-existent recommendation returns 404"""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/recommendations/{fake_uuid}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_recommendations_deterministic(client, complete_application, test_loan_product):
    """Test that recommendations are deterministic (same input = same output)"""
    app_id = complete_application["id"]

    # Generate recommendations twice
    response1 = client.post(f"/api/v1/recommendations/generate/{app_id}")
    response2 = client.post(f"/api/v1/recommendations/generate/{app_id}")

    data1 = response1.json()
    data2 = response2.json()

    # Should have same number of recommended and rejected products
    assert len(data1["recommended"]) == len(data2["recommended"])
    assert len(data1["rejected"]) == len(data2["rejected"])

    # If there are recommendations, scores should match
    if len(data1["recommended"]) > 0 and len(data2["recommended"]) > 0:
        # Compare first recommended product scores
        assert data1["recommended"][0]["fit_score"] == pytest.approx(
            data2["recommended"][0]["fit_score"], rel=1e-6
        )


def test_recommendation_filters_by_constraints(client, test_loan_product):
    """Test that recommendations filter products by hard constraints"""
    # Create application that doesn't meet product constraints
    app_data = {
        "borrower_name": "Test User",
        "borrower_email": "test@example.com",
        "borrower_phone": "0900000000",
        "purpose": "HOME_PURCHASE",
        "loan_amount_requested": 500000000,
        "tenor_months_preferred": 180,
        "geo_location": "HCM",
        "incomes": [
            {
                "source_type": "SALARY",
                "amount_monthly": 10000000,  # Below min_income_monthly (15M)
                "employer_name": "Company",
                "years_at_current": 1
            }
        ],
        "debts": [],
        "collaterals": [
            {
                "collateral_type": "HOUSE",
                "appraised_value": 600000000,
                "location": "HCM",
                "ownership_status": "OWNED"
            }
        ]
    }

    response = client.post("/api/v1/applications", json=app_data)
    app_id = response.json()["id"]

    # Generate recommendations
    rec_response = client.post(f"/api/v1/recommendations/generate/{app_id}")
    data = rec_response.json()

    # Product should be rejected due to min income constraint
    rejected_product_ids = [r["product_id"] for r in data["rejected"]]
    assert str(test_loan_product.id) in rejected_product_ids

    # Find the rejection reason
    rejection = next(r for r in data["rejected"] if r["product_id"] == str(test_loan_product.id))
    assert rejection["reason_code"] == "MIN_INCOME"
