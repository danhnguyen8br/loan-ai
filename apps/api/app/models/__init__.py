from app.models.user import User
from app.models.bank import Bank, BankType
from app.models.loan_product import LoanProduct, LoanPurpose, RepaymentMethod, PaymentFrequency
from app.models.rate_model import RateModel
from app.models.fees_penalties import FeesPenalties
from app.models.source_audit import SourceAudit, SourceType
from app.models.application import (
    Application,
    ApplicationIncome,
    ApplicationDebt,
    ApplicationCollateral,
    ApplicationStatus,
    ProofStrength,
    IncomeType,
    CollateralType,
    LegalStatus,
)
from app.models.recommendation import RecommendationRun

__all__ = [
    # User
    "User",
    # Bank
    "Bank",
    "BankType",
    # Loan Product
    "LoanProduct",
    "LoanPurpose",
    "RepaymentMethod",
    "PaymentFrequency",
    # Rate Model
    "RateModel",
    # Fees & Penalties
    "FeesPenalties",
    # Source Audit
    "SourceAudit",
    "SourceType",
    # Application
    "Application",
    "ApplicationIncome",
    "ApplicationDebt",
    "ApplicationCollateral",
    "ApplicationStatus",
    "ProofStrength",
    "IncomeType",
    "CollateralType",
    "LegalStatus",
    # Recommendation
    "RecommendationRun",
]
