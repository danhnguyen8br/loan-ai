"""
Application Service Layer

Handles CRUD operations for loan applications and financial metrics calculation.
"""
from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.application import (
    Application, 
    ApplicationIncome, 
    ApplicationDebt, 
    ApplicationCollateral,
    ProofStrength,
    IncomeType,
    CollateralType,
    LegalStatus,
)
from app.schemas import applications as schemas
from app.services.financial import annuity_payment


def calculate_application_metrics(application: Application) -> dict:
    """
    Calculate core financial metrics from an Application ORM object.
    
    Returns:
        Dict with total_income, total_debt_payments, dsr, ltv, dti, and property_value
    """
    # Calculate total income from income entries
    total_income = sum(float(income.monthly_net) for income in application.incomes)
    
    # Also use monthly_income_vnd if set directly on application
    if application.monthly_income_vnd:
        total_income = max(total_income, float(application.monthly_income_vnd))
    
    # Calculate total debt payments
    total_debt_payments = sum(float(debt.monthly_payment) for debt in application.debts)
    if application.existing_debts_monthly_payment_vnd:
        total_debt_payments = max(total_debt_payments, float(application.existing_debts_monthly_payment_vnd))

    # DSR = Debt Service Ratio
    dsr = total_debt_payments / total_income if total_income > 0 else None

    # Calculate property/collateral value
    property_value = 0.0
    if application.estimated_property_value_vnd:
        property_value = float(application.estimated_property_value_vnd)
    elif application.collaterals:
        property_value = sum(float(c.estimated_value) for c in application.collaterals)

    # LTV = Loan-to-Value
    ltv = None
    if property_value > 0:
        ltv = float(application.loan_amount) / property_value

    # DTI = Debt-to-Income (outstanding debt / annual income)
    dti = None
    if total_income > 0:
        total_outstanding_debt = sum(float(debt.outstanding_balance or 0) for debt in application.debts)
        annual_income = total_income * 12
        dti = total_outstanding_debt / annual_income if annual_income > 0 else None

    return {
        "total_income": total_income,
        "total_debt_payments": total_debt_payments,
        "dsr": dsr,
        "ltv": ltv,
        "dti": dti,
        "property_value": property_value,
    }


def create_application(db: Session, application: schemas.ApplicationCreate) -> Application:
    """Create a new application with all related entities."""
    
    # Parse enum values
    income_type = None
    if application.income_type:
        try:
            income_type = IncomeType(application.income_type)
        except ValueError:
            pass
    
    proof_strength = None
    if application.proof_strength:
        try:
            proof_strength = ProofStrength(application.proof_strength)
        except ValueError:
            pass
    
    property_type = None
    if application.property_type:
        try:
            property_type = CollateralType(application.property_type)
        except ValueError:
            pass
    
    legal_status = None
    if application.legal_status:
        try:
            legal_status = LegalStatus(application.legal_status)
        except ValueError:
            pass
    
    # Convert preferences and credit_flags to dicts
    preferences = None
    if application.preferences:
        preferences = application.preferences.model_dump() if hasattr(application.preferences, 'model_dump') else application.preferences
    
    credit_flags = None
    if application.credit_flags:
        credit_flags = application.credit_flags.model_dump() if hasattr(application.credit_flags, 'model_dump') else application.credit_flags
    
    db_application = Application(
        # Loan details
        purpose=application.purpose,
        loan_amount=application.loan_amount,
        tenor_months=application.tenor_months,
        
        # Property/Purchase details
        purchase_price_vnd=application.purchase_price_vnd,
        down_payment_vnd=application.down_payment_vnd,
        
        # Comparison and prepayment planning
        planned_hold_months=application.planned_hold_months,
        expected_prepayment_month=application.expected_prepayment_month,
        expected_prepayment_amount_vnd=application.expected_prepayment_amount_vnd,
        
        # Timing
        need_disbursement_by_date=application.need_disbursement_by_date,
        
        # Location
        geo_location=application.geo_location,
        
        # Borrower profile
        income_type=income_type,
        monthly_income_vnd=application.monthly_income_vnd,
        proof_strength=proof_strength,
        existing_debts_monthly_payment_vnd=application.existing_debts_monthly_payment_vnd,
        credit_flags=credit_flags or {},
        
        # Property details
        property_type=property_type,
        property_location_province=application.property_location_province,
        property_location_district=application.property_location_district,
        legal_status=legal_status,
        estimated_property_value_vnd=application.estimated_property_value_vnd,
        
        # Preferences
        preferences=preferences or {},
        
        # Legacy
        stuck_reasons=application.stuck_reasons,
    )
    db.add(db_application)
    db.flush()

    # Add incomes
    for income in application.incomes:
        income_proof_strength = None
        if income.proof_strength:
            try:
                income_proof_strength = ProofStrength(income.proof_strength)
            except ValueError:
                pass
        
        db_income = ApplicationIncome(
            application_id=db_application.id,
            source=income.source,
            monthly_net=income.monthly_net,
            proof_type=income.proof_type,
            proof_strength=income_proof_strength,
        )
        db.add(db_income)

    # Add debts
    for debt in application.debts:
        db_debt = ApplicationDebt(
            application_id=db_application.id,
            debt_type=debt.debt_type,
            monthly_payment=debt.monthly_payment,
            outstanding_balance=debt.outstanding_balance,
            remaining_months=debt.remaining_months,
        )
        db.add(db_debt)

    # Add collaterals
    for collateral in application.collaterals:
        coll_legal_status = None
        if collateral.legal_status:
            try:
                coll_legal_status = LegalStatus(collateral.legal_status)
            except ValueError:
                pass
        
        db_collateral = ApplicationCollateral(
            application_id=db_application.id,
            collateral_type=collateral.collateral_type,
            estimated_value=collateral.estimated_value,
            location=collateral.location,
            district=collateral.district,
            legal_status=coll_legal_status,
            property_age_years=collateral.property_age_years,
            has_red_book=collateral.has_red_book,
        )
        db.add(db_collateral)

    db.commit()
    db.refresh(db_application)
    return db_application


def get_application(db: Session, application_id: UUID) -> Optional[Application]:
    """Get application by ID."""
    return db.query(Application).filter(Application.id == application_id).first()


def update_application(db: Session, application_id: UUID, application: schemas.ApplicationUpdate) -> Optional[Application]:
    """Update application with partial data."""
    db_application = get_application(db, application_id)
    if not db_application:
        return None

    # Get update data, excluding None values
    update_data = application.model_dump(exclude_unset=True)
    
    # Handle enum conversions
    if "income_type" in update_data and update_data["income_type"]:
        try:
            update_data["income_type"] = IncomeType(update_data["income_type"])
        except ValueError:
            del update_data["income_type"]
    
    if "proof_strength" in update_data and update_data["proof_strength"]:
        try:
            update_data["proof_strength"] = ProofStrength(update_data["proof_strength"])
        except ValueError:
            del update_data["proof_strength"]
    
    if "property_type" in update_data and update_data["property_type"]:
        try:
            update_data["property_type"] = CollateralType(update_data["property_type"])
        except ValueError:
            del update_data["property_type"]
    
    if "legal_status" in update_data and update_data["legal_status"]:
        try:
            update_data["legal_status"] = LegalStatus(update_data["legal_status"])
        except ValueError:
            del update_data["legal_status"]
    
    # Handle nested objects
    if "preferences" in update_data and update_data["preferences"]:
        if hasattr(update_data["preferences"], 'model_dump'):
            update_data["preferences"] = update_data["preferences"].model_dump()
    
    if "credit_flags" in update_data and update_data["credit_flags"]:
        if hasattr(update_data["credit_flags"], 'model_dump'):
            update_data["credit_flags"] = update_data["credit_flags"].model_dump()
    
    # Handle related entities
    incomes = update_data.pop("incomes", None)
    debts = update_data.pop("debts", None)
    collaterals = update_data.pop("collaterals", None)
    
    # Update scalar fields
    for field, value in update_data.items():
        setattr(db_application, field, value)

    # Update incomes if provided
    if incomes is not None:
        db.query(ApplicationIncome).filter(ApplicationIncome.application_id == application_id).delete()
        for income in incomes:
            income_proof_strength = None
            if income.get("proof_strength"):
                try:
                    income_proof_strength = ProofStrength(income["proof_strength"])
                except ValueError:
                    pass
            
            db_income = ApplicationIncome(
                application_id=application_id,
                source=income["source"],
                monthly_net=income["monthly_net"],
                proof_type=income.get("proof_type"),
                proof_strength=income_proof_strength,
            )
            db.add(db_income)

    # Update debts if provided
    if debts is not None:
        db.query(ApplicationDebt).filter(ApplicationDebt.application_id == application_id).delete()
        for debt in debts:
            db_debt = ApplicationDebt(
                application_id=application_id,
                debt_type=debt["debt_type"],
                monthly_payment=debt["monthly_payment"],
                outstanding_balance=debt.get("outstanding_balance"),
                remaining_months=debt.get("remaining_months"),
            )
            db.add(db_debt)

    # Update collaterals if provided
    if collaterals is not None:
        db.query(ApplicationCollateral).filter(ApplicationCollateral.application_id == application_id).delete()
        for collateral in collaterals:
            coll_legal_status = None
            if collateral.get("legal_status"):
                try:
                    coll_legal_status = LegalStatus(collateral["legal_status"])
                except ValueError:
                    pass
            
            db_collateral = ApplicationCollateral(
                application_id=application_id,
                collateral_type=collateral["collateral_type"],
                estimated_value=collateral["estimated_value"],
                location=collateral.get("location"),
                district=collateral.get("district"),
                legal_status=coll_legal_status,
                property_age_years=collateral.get("property_age_years"),
                has_red_book=collateral.get("has_red_book"),
            )
            db.add(db_collateral)

    db.commit()
    db.refresh(db_application)
    return db_application


def compute_metrics(db: Session, application_id: UUID) -> schemas.ComputeMetricsResponse:
    """Compute DSR, LTV, DTI, and payment estimates for an application."""
    application = get_application(db, application_id)
    if not application:
        raise ValueError("Application not found")

    metrics = calculate_application_metrics(application)

    # Estimate monthly payment (principal only as baseline)
    estimated_payment = annuity_payment(
        principal=float(application.loan_amount),
        annual_rate=0.0,
        months=application.tenor_months,
    )
    
    # Calculate available for new debt
    available_for_new_debt = None
    if metrics["total_income"] > 0:
        available_for_new_debt = metrics["total_income"] - metrics["total_debt_payments"]

    return schemas.ComputeMetricsResponse(
        application_id=application_id,
        ltv=metrics["ltv"],
        dsr=metrics["dsr"],
        dti=metrics["dti"],
        monthly_net_income=metrics["total_income"],
        total_monthly_debt_payments=metrics["total_debt_payments"],
        estimated_monthly_payment=estimated_payment,
        available_for_new_debt=available_for_new_debt,
    )
