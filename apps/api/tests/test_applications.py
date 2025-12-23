"""
Integration tests for loan application endpoints
"""
import pytest
from fastapi import status


@pytest.fixture
def sample_application_data():
    """Sample application data for testing"""
    return {
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
                "employer_name": "Tech Company",
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
                "location": "District 1, HCM",
                "ownership_status": "OWNED"
            }
        ]
    }


def test_create_application(client, sample_application_data):
    """Test creating a new loan application"""
    response = client.post("/api/v1/applications", json=sample_application_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["borrower_name"] == sample_application_data["borrower_name"]
    assert data["status"] == "DRAFT"
    assert "id" in data
    assert len(data["incomes"]) == 1
    assert len(data["debts"]) == 1
    assert len(data["collaterals"]) == 1


def test_get_application_by_id(client, sample_application_data):
    """Test retrieving an application by ID"""
    # Create application
    create_response = client.post("/api/v1/applications", json=sample_application_data)
    app_id = create_response.json()["id"]

    # Get application
    response = client.get(f"/api/v1/applications/{app_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == app_id
    assert data["borrower_name"] == sample_application_data["borrower_name"]


def test_get_application_not_found(client):
    """Test getting non-existent application returns 404"""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/applications/{fake_uuid}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_compute_metrics(client, sample_application_data):
    """Test computing application metrics (DSR, LTV, DTI)"""
    # Create application
    create_response = client.post("/api/v1/applications", json=sample_application_data)
    app_id = create_response.json()["id"]

    # Compute metrics
    response = client.post(f"/api/v1/applications/{app_id}/metrics")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Check metrics structure
    assert "dsr" in data
    assert "ltv" in data
    assert "dti" in data

    # Validate metric values
    assert 0 <= data["ltv"] <= 1  # LTV should be between 0 and 1
    assert data["dsr"] >= 0  # DSR should be positive
    assert data["dti"] >= 0  # DTI should be positive


def test_compute_metrics_calculations(client, sample_application_data):
    """Test that metrics are calculated correctly"""
    # Create application
    create_response = client.post("/api/v1/applications", json=sample_application_data)
    app_id = create_response.json()["id"]

    # Compute metrics
    response = client.post(f"/api/v1/applications/{app_id}/metrics")
    data = response.json()

    # LTV = loan_amount / collateral_value
    # 500,000,000 / 800,000,000 = 0.625
    assert data["ltv"] == pytest.approx(0.625, rel=1e-3)

    # DTI = total_debt_payment / total_income
    # 2,000,000 / 30,000,000 = 0.0667
    assert data["dti"] == pytest.approx(0.0667, rel=1e-3)


def test_update_application(client, sample_application_data):
    """Test updating an application"""
    # Create application
    create_response = client.post("/api/v1/applications", json=sample_application_data)
    app_id = create_response.json()["id"]

    # Update application
    update_data = {
        "status": "SUBMITTED",
        "borrower_name": "Updated Name"
    }
    response = client.put(f"/api/v1/applications/{app_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "SUBMITTED"
    assert data["borrower_name"] == "Updated Name"


def test_create_application_validation(client):
    """Test that invalid application data is rejected"""
    invalid_data = {
        "borrower_name": "Test",
        # Missing required fields
    }
    response = client.post("/api/v1/applications", json=invalid_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
