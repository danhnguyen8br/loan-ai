"""
Product and Bank Service Layer

Handles CRUD operations for banks, products, rate models, and fees.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from uuid import UUID
from typing import Optional, List

from app.models.loan_product import LoanProduct, LoanPurpose
from app.models.bank import Bank, BankType
from app.models.rate_model import RateModel
from app.models.fees_penalties import FeesPenalties
from app.schemas import products as schemas


# ============================================================================
# Bank Operations
# ============================================================================

def list_banks(db: Session, include_inactive: bool = False) -> List[dict]:
    """List all banks with product counts."""
    query = db.query(Bank)
    if not include_inactive:
        query = query.filter(Bank.is_active == True)
    
    banks = query.all()
    
    result = []
    for bank in banks:
        # Count products for this bank
        product_count = db.query(func.count(LoanProduct.id)).filter(
            LoanProduct.bank_id == bank.id
        ).scalar()
        
        active_product_count = db.query(func.count(LoanProduct.id)).filter(
            LoanProduct.bank_id == bank.id,
            LoanProduct.is_active == True
        ).scalar()
        
        bank_dict = {
            "id": bank.id,
            "name": bank.name,
            "short_name": bank.short_name,
            "bank_type": bank.bank_type.value if bank.bank_type else "PRIVATE",
            "logo_url": bank.logo_url,
            "official_site": bank.official_site,
            "contact_hotline": bank.contact_hotline,
            "description": bank.description,
            "coverage_provinces": bank.coverage_provinces or [],
            "processing_sla": bank.processing_sla or {},
            "source_urls": bank.source_urls or [],
            "last_verified_at": bank.last_verified_at,
            "last_crawled_at": bank.last_crawled_at,
            "data_confidence_score": bank.data_confidence_score,
            "is_active": bank.is_active,
            "created_at": bank.created_at,
            "updated_at": bank.updated_at,
            "product_count": product_count,
            "active_product_count": active_product_count,
        }
        result.append(bank_dict)
    return result


def get_bank(db: Session, bank_id: UUID) -> Optional[Bank]:
    """Get bank by ID."""
    return db.query(Bank).filter(Bank.id == bank_id).first()


def create_bank(db: Session, bank: schemas.BankCreate) -> dict:
    """Create a new bank."""
    # Convert processing_sla to dict if present
    processing_sla = None
    if bank.processing_sla:
        processing_sla = bank.processing_sla.model_dump() if hasattr(bank.processing_sla, 'model_dump') else bank.processing_sla
    
    db_bank = Bank(
        name=bank.name,
        short_name=bank.short_name,
        bank_type=BankType(bank.bank_type) if bank.bank_type else BankType.PRIVATE,
        logo_url=bank.logo_url,
        official_site=bank.official_site,
        contact_hotline=bank.contact_hotline,
        description=bank.description,
        coverage_provinces=bank.coverage_provinces or [],
        processing_sla=processing_sla or {},
        source_urls=bank.source_urls or [],
        data_confidence_score=bank.data_confidence_score or 50,
        is_active=bank.is_active,
    )
    db.add(db_bank)
    db.commit()
    db.refresh(db_bank)
    
    return {
        **db_bank.__dict__,
        "bank_type": db_bank.bank_type.value if db_bank.bank_type else "PRIVATE",
        "product_count": 0,
        "active_product_count": 0,
    }


def update_bank(db: Session, bank_id: UUID, bank: schemas.BankUpdate) -> Optional[dict]:
    """Update bank."""
    db_bank = get_bank(db, bank_id)
    if not db_bank:
        return None

    update_data = bank.model_dump(exclude_unset=True)
    
    # Handle special fields
    if "bank_type" in update_data and update_data["bank_type"]:
        update_data["bank_type"] = BankType(update_data["bank_type"])
    
    if "processing_sla" in update_data and update_data["processing_sla"]:
        if hasattr(update_data["processing_sla"], 'model_dump'):
            update_data["processing_sla"] = update_data["processing_sla"].model_dump()

    for field, value in update_data.items():
        setattr(db_bank, field, value)

    db.commit()
    db.refresh(db_bank)
    
    # Get product counts
    product_count = db.query(func.count(LoanProduct.id)).filter(
        LoanProduct.bank_id == bank_id
    ).scalar()
    active_product_count = db.query(func.count(LoanProduct.id)).filter(
        LoanProduct.bank_id == bank_id,
        LoanProduct.is_active == True
    ).scalar()
    
    return {
        **db_bank.__dict__,
        "bank_type": db_bank.bank_type.value if db_bank.bank_type else "PRIVATE",
        "product_count": product_count,
        "active_product_count": active_product_count,
    }


def set_bank_status(db: Session, bank_id: UUID, is_active: bool) -> Optional[dict]:
    """Set bank active status and cascade to products if deactivating."""
    db_bank = get_bank(db, bank_id)
    if not db_bank:
        return None
    
    db_bank.is_active = is_active
    
    # If deactivating, also deactivate all products
    products_affected = 0
    if not is_active:
        products_affected = db.query(LoanProduct).filter(
            LoanProduct.bank_id == bank_id,
            LoanProduct.is_active == True
        ).update({"is_active": False})
    
    db.commit()
    db.refresh(db_bank)
    
    return {
        "bank": db_bank,
        "products_deactivated": products_affected
    }


def delete_bank(db: Session, bank_id: UUID) -> bool:
    """Delete bank (only if no products exist)."""
    db_bank = get_bank(db, bank_id)
    if not db_bank:
        return False
    
    # Check if bank has products
    product_count = db.query(func.count(LoanProduct.id)).filter(
        LoanProduct.bank_id == bank_id
    ).scalar()
    
    if product_count > 0:
        return False  # Cannot delete bank with products
    
    db.delete(db_bank)
    db.commit()
    return True


# ============================================================================
# Product Operations
# ============================================================================

def list_products(
    db: Session, 
    purpose: Optional[str] = None, 
    bank_id: Optional[UUID] = None,
    include_inactive: bool = False
) -> List[dict]:
    """List loan products with optional filtering."""
    query = db.query(LoanProduct).options(
        joinedload(LoanProduct.bank),
        joinedload(LoanProduct.rate_model),
        joinedload(LoanProduct.fees_penalties),
    )
    
    if purpose:
        try:
            purpose_enum = LoanPurpose(purpose)
            query = query.filter(LoanProduct.purpose == purpose_enum)
        except ValueError:
            # Legacy string match
            query = query.filter(LoanProduct.purpose == purpose)
    
    if bank_id:
        query = query.filter(LoanProduct.bank_id == bank_id)
    
    if not include_inactive:
        query = query.filter(LoanProduct.is_active == True)
    
    products = query.all()
    
    result = []
    for product in products:
        product_dict = _product_to_dict(product)
        result.append(product_dict)
    
    return result


def get_product(db: Session, product_id: UUID) -> Optional[LoanProduct]:
    """Get product by ID."""
    return db.query(LoanProduct).options(
        joinedload(LoanProduct.bank),
        joinedload(LoanProduct.rate_model),
        joinedload(LoanProduct.fees_penalties),
    ).filter(LoanProduct.id == product_id).first()


def create_product(db: Session, product: schemas.ProductCreate) -> dict:
    """Create a new loan product with optional rate model and fees."""
    # Convert eligibility, collateral, repayment to dicts
    eligibility = None
    if product.eligibility:
        eligibility = product.eligibility.model_dump() if hasattr(product.eligibility, 'model_dump') else product.eligibility
    
    collateral = None
    if product.collateral:
        collateral = product.collateral.model_dump() if hasattr(product.collateral, 'model_dump') else product.collateral
    
    repayment = None
    if product.repayment:
        repayment = product.repayment.model_dump() if hasattr(product.repayment, 'model_dump') else product.repayment
    
    # Create the product
    db_product = LoanProduct(
        bank_id=product.bank_id,
        name=product.name,
        purpose=LoanPurpose(product.purpose) if product.purpose else LoanPurpose.HOME_PURCHASE,
        description=product.description,
        target_segment=product.target_segment or [],
        currency=product.currency or "VND",
        effective_from=product.effective_from,
        effective_to=product.effective_to,
        min_loan_amount=product.min_loan_amount,
        max_loan_amount=product.max_loan_amount,
        max_ltv_pct=product.max_ltv_pct,
        min_term_months=product.min_term_months,
        max_term_months=product.max_term_months,
        max_age_at_maturity=product.max_age_at_maturity,
        eligibility=eligibility or {},
        collateral=collateral or {},
        repayment=repayment or {},
        rate_fixed_months=product.rate_fixed_months,
        rate_fixed=product.rate_fixed,
        floating_margin=product.floating_margin,
        reference_rate_name=product.reference_rate_name,
        constraints_json=product.constraints_json,
        sla_days_estimate=product.sla_days_estimate,
        reference_url=product.reference_url,
        is_active=product.is_active,
    )
    db.add(db_product)
    db.flush()  # Get the ID
    
    # Create rate model if provided
    if product.rate_model:
        rm = product.rate_model
        db_rate_model = RateModel(
            loan_product_id=db_product.id,
            promo_options=[opt.model_dump() for opt in rm.promo_options] if rm.promo_options else [],
            floating=rm.floating.model_dump() if rm.floating else {},
            reference_rate_base_pct=rm.reference_rate_base_pct,
            notes=rm.notes,
            assumptions=rm.assumptions,
        )
        db.add(db_rate_model)
    
    # Create fees if provided
    if product.fees_penalties:
        fp = product.fees_penalties
        db_fees = FeesPenalties(
            loan_product_id=db_product.id,
            upfront=fp.upfront.model_dump() if fp.upfront else {},
            recurring=fp.recurring.model_dump() if fp.recurring else {},
            prepayment=fp.prepayment.model_dump() if fp.prepayment else {},
            late_overdue=fp.late_overdue.model_dump() if fp.late_overdue else {},
            notes=fp.notes,
        )
        db.add(db_fees)
    
    db.commit()
    db.refresh(db_product)
    
    return _product_to_dict(db_product)


def update_product(db: Session, product_id: UUID, product: schemas.ProductUpdate) -> Optional[dict]:
    """Update loan product."""
    db_product = get_product(db, product_id)
    if not db_product:
        return None

    update_data = product.model_dump(exclude_unset=True)
    
    # Handle special fields
    if "purpose" in update_data and update_data["purpose"]:
        try:
            update_data["purpose"] = LoanPurpose(update_data["purpose"])
        except ValueError:
            pass  # Keep as string for legacy
    
    if "eligibility" in update_data and update_data["eligibility"]:
        if hasattr(update_data["eligibility"], 'model_dump'):
            update_data["eligibility"] = update_data["eligibility"].model_dump()
    
    if "collateral" in update_data and update_data["collateral"]:
        if hasattr(update_data["collateral"], 'model_dump'):
            update_data["collateral"] = update_data["collateral"].model_dump()
    
    if "repayment" in update_data and update_data["repayment"]:
        if hasattr(update_data["repayment"], 'model_dump'):
            update_data["repayment"] = update_data["repayment"].model_dump()

    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    
    return _product_to_dict(db_product)


def delete_product(db: Session, product_id: UUID) -> bool:
    """Delete loan product."""
    db_product = db.query(LoanProduct).filter(LoanProduct.id == product_id).first()
    if not db_product:
        return False

    db.delete(db_product)
    db.commit()
    return True


# ============================================================================
# Helper Functions
# ============================================================================

def _product_to_dict(product: LoanProduct) -> dict:
    """Convert LoanProduct model to dict for API response."""
    product_dict = {
        "id": product.id,
        "bank_id": product.bank_id,
        "name": product.name,
        "purpose": product.purpose.value if hasattr(product.purpose, 'value') else product.purpose,
        "description": product.description,
        "target_segment": product.target_segment or [],
        "currency": product.currency or "VND",
        "effective_from": product.effective_from,
        "effective_to": product.effective_to,
        "min_loan_amount": float(product.min_loan_amount) if product.min_loan_amount else None,
        "max_loan_amount": float(product.max_loan_amount) if product.max_loan_amount else None,
        "max_ltv_pct": float(product.max_ltv_pct) if product.max_ltv_pct else None,
        "min_term_months": product.min_term_months,
        "max_term_months": product.max_term_months,
        "max_age_at_maturity": product.max_age_at_maturity,
        "eligibility": product.eligibility or {},
        "collateral": product.collateral or {},
        "repayment": product.repayment or {},
        "rate_fixed_months": product.rate_fixed_months,
        "rate_fixed": float(product.rate_fixed) if product.rate_fixed else None,
        "floating_margin": float(product.floating_margin) if product.floating_margin else None,
        "reference_rate_name": product.reference_rate_name,
        "constraints_json": product.constraints_json,
        "sla_days_estimate": product.sla_days_estimate,
        "reference_url": product.reference_url,
        "is_active": product.is_active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "bank_name": product.bank.short_name if product.bank else None,
    }
    
    # Add rate model if exists
    if product.rate_model:
        product_dict["rate_model"] = {
            "id": product.rate_model.id,
            "loan_product_id": product.rate_model.loan_product_id,
            "promo_options": product.rate_model.promo_options or [],
            "floating": product.rate_model.floating or {},
            "reference_rate_base_pct": float(product.rate_model.reference_rate_base_pct) if product.rate_model.reference_rate_base_pct else 5.0,
            "notes": product.rate_model.notes,
            "assumptions": product.rate_model.assumptions,
            "created_at": product.rate_model.created_at,
            "updated_at": product.rate_model.updated_at,
        }
    
    # Add fees if exists
    if product.fees_penalties:
        product_dict["fees_penalties"] = {
            "id": product.fees_penalties.id,
            "loan_product_id": product.fees_penalties.loan_product_id,
            "upfront": product.fees_penalties.upfront or {},
            "recurring": product.fees_penalties.recurring or {},
            "prepayment": product.fees_penalties.prepayment or {},
            "late_overdue": product.fees_penalties.late_overdue or {},
            "notes": product.fees_penalties.notes,
            "created_at": product.fees_penalties.created_at,
            "updated_at": product.fees_penalties.updated_at,
        }
    
    return product_dict
