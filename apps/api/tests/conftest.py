"""
Pytest configuration and fixtures for integration tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.bank import Bank
from app.models.loan_product import LoanProduct
from app.services.auth import hash_password, create_access_token

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("testpassword123"),
        full_name="Test User",
        phone="0901234567"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user):
    """Create an access token for the test user"""
    return create_access_token(data={"sub": str(test_user.id), "email": test_user.email})


@pytest.fixture
def auth_headers(test_user_token):
    """Create authorization headers with bearer token"""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def test_bank(db_session):
    """Create a test bank"""
    bank = Bank(
        name="Test Bank",
        short_name="TB",
        logo_url="https://example.com/logo.png",
        description="A test bank for integration tests"
    )
    db_session.add(bank)
    db_session.commit()
    db_session.refresh(bank)
    return bank


@pytest.fixture
def test_loan_product(db_session, test_bank):
    """Create a test loan product"""
    product = LoanProduct(
        bank_id=test_bank.id,
        name="Test Home Loan",
        purpose="HOME_PURCHASE",
        description="A test loan product",
        rate_fixed_months=24,
        rate_fixed=7.5,
        floating_margin=2.5,
        reference_rate_name="Test rate",
        sla_days_estimate=15,
        constraints_json={
            "hard": {
                "max_ltv": 0.70,
                "max_dsr": 0.50,
                "min_income_monthly": 15000000,
                "max_tenor_months": 240,
                "allowed_collateral_types": ["HOUSE", "CONDO"],
                "geo_allowed": ["HCM", "HN"]
            },
            "soft": {
                "pref_fixed_months_weight": 0.3,
                "pref_fast_sla_weight": 0.2,
                "pref_low_fee_weight": 0.2
            }
        }
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product
