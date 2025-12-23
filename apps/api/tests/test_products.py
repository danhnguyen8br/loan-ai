"""
Integration tests for loan product endpoints
"""
import pytest
from fastapi import status


def test_list_products(client, test_loan_product):
    """Test listing all loan products"""
    response = client.get("/api/v1/products")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == test_loan_product.name


def test_list_products_filter_by_purpose(client, test_loan_product):
    """Test filtering products by purpose"""
    response = client.get("/api/v1/products?purpose=HOME_PURCHASE")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert all(p["purpose"] == "HOME_PURCHASE" for p in data)


def test_list_products_empty_filter(client, test_loan_product):
    """Test filtering with non-matching purpose returns empty list"""
    response = client.get("/api/v1/products?purpose=NONEXISTENT")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 0


def test_get_product_by_id(client, test_loan_product):
    """Test getting a specific product by ID"""
    response = client.get(f"/api/v1/products/{test_loan_product.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(test_loan_product.id)
    assert data["name"] == test_loan_product.name
    assert "constraints_json" in data


def test_get_product_not_found(client):
    """Test getting non-existent product returns 404"""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/products/{fake_uuid}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_product_structure(client, test_loan_product):
    """Test that product response has correct structure"""
    response = client.get(f"/api/v1/products/{test_loan_product.id}")
    data = response.json()

    # Check basic fields
    assert "id" in data
    assert "bank_id" in data
    assert "name" in data
    assert "purpose" in data
    assert "rate_fixed_months" in data
    assert "rate_fixed" in data

    # Check constraints structure
    constraints = data["constraints_json"]
    assert "hard" in constraints
    assert "max_ltv" in constraints["hard"]
    assert "max_dsr" in constraints["hard"]
    assert "min_income_monthly" in constraints["hard"]
