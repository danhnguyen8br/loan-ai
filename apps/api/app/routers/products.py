"""
Product and Bank API Routes

Includes endpoints for:
- Banks: CRUD with processing SLA and data confidence
- Products: CRUD with full rate/fee structure
- Rate Models: Admin management of promotional rates
- Fees & Penalties: Admin management of fee structures
- Source Audits: Track data sources and verification
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from uuid import UUID

from app.core.database import get_db
from app.schemas import products as schemas
from app.services import products as service
from app.models.loan_product import LoanProduct
from app.models.rate_model import RateModel
from app.models.fees_penalties import FeesPenalties
from app.models.source_audit import SourceAudit, SourceType
from app.models.bank import Bank

router = APIRouter()


# ============================================================================
# Bank Endpoints
# ============================================================================

@router.get("/banks", response_model=List[schemas.BankResponse])
def list_banks(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """List all banks with product counts."""
    return service.list_banks(db, include_inactive=include_inactive)


@router.get("/banks/{bank_id}", response_model=schemas.BankResponse)
def get_bank(bank_id: UUID, db: Session = Depends(get_db)):
    """Get bank by ID with product counts."""
    bank = service.get_bank(db, bank_id)
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    # Get product counts
    product_count = db.query(func.count(LoanProduct.id)).filter(
        LoanProduct.bank_id == bank_id
    ).scalar()
    
    active_product_count = db.query(func.count(LoanProduct.id)).filter(
        LoanProduct.bank_id == bank_id,
        LoanProduct.is_active == True
    ).scalar()
    
    return {
        **bank.__dict__,
        "product_count": product_count,
        "active_product_count": active_product_count,
    }


@router.post("/banks", response_model=schemas.BankResponse)
def create_bank(
    bank: schemas.BankCreate,
    db: Session = Depends(get_db)
):
    """Create a new bank (admin)."""
    return service.create_bank(db, bank)


@router.put("/banks/{bank_id}", response_model=schemas.BankResponse)
def update_bank(
    bank_id: UUID,
    bank: schemas.BankUpdate,
    db: Session = Depends(get_db)
):
    """Update bank (admin)."""
    updated = service.update_bank(db, bank_id, bank)
    if not updated:
        raise HTTPException(status_code=404, detail="Bank not found")
    return updated


@router.patch("/banks/{bank_id}/status")
def set_bank_status(
    bank_id: UUID,
    status: schemas.BankStatusUpdate,
    db: Session = Depends(get_db)
):
    """Set bank active status (admin). Deactivating cascades to all products."""
    result = service.set_bank_status(db, bank_id, status.is_active)
    if not result:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    return {
        "message": f"Bank {'activated' if status.is_active else 'deactivated'} successfully",
        "bank_id": str(bank_id),
        "is_active": status.is_active,
        "products_deactivated": result.get("products_deactivated", 0)
    }


@router.patch("/banks/{bank_id}/verify")
def verify_bank_data(
    bank_id: UUID,
    confidence_score: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Mark bank data as verified (admin)."""
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    from datetime import datetime
    bank.last_verified_at = datetime.utcnow()
    if confidence_score is not None:
        bank.data_confidence_score = max(0, min(100, confidence_score))
    
    db.commit()
    return {"message": "Bank data verified", "last_verified_at": bank.last_verified_at}


@router.delete("/banks/{bank_id}")
def delete_bank(bank_id: UUID, db: Session = Depends(get_db)):
    """Delete bank (admin). Only works if bank has no products."""
    deleted = service.delete_bank(db, bank_id)
    if not deleted:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete bank. Bank not found or has existing products."
        )
    return {"message": "Bank deleted successfully"}


# ============================================================================
# Product Endpoints
# ============================================================================

@router.get("/", response_model=List[schemas.ProductResponse])
def list_products(
    purpose: Optional[str] = None,
    bank_id: Optional[UUID] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """List loan products with optional filtering."""
    return service.list_products(
        db, 
        purpose=purpose, 
        bank_id=bank_id,
        include_inactive=include_inactive
    )


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    """Get product by ID with full details including rate model and fees."""
    product = (
        db.query(LoanProduct)
        .options(
            joinedload(LoanProduct.bank),
            joinedload(LoanProduct.rate_model),
            joinedload(LoanProduct.fees_penalties),
        )
        .filter(LoanProduct.id == product_id)
        .first()
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    response = {
        **product.__dict__,
        "bank_name": product.bank.short_name if product.bank else None,
    }
    
    # Add rate model if exists
    if product.rate_model:
        response["rate_model"] = {
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
        response["fees_penalties"] = {
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
    
    return response


@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new loan product with optional rate model and fees (admin)."""
    return service.create_product(db, product)


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: UUID,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update loan product (admin)."""
    updated = service.update_product(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated


@router.patch("/{product_id}/status")
def set_product_status(
    product_id: UUID,
    status: schemas.BankStatusUpdate,
    db: Session = Depends(get_db)
):
    """Set product active status (admin)."""
    product = db.query(LoanProduct).filter(LoanProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.is_active = status.is_active
    db.commit()
    
    return {
        "message": f"Product {'activated' if status.is_active else 'deactivated'} successfully",
        "product_id": str(product_id),
        "is_active": status.is_active
    }


@router.delete("/{product_id}")
def delete_product(product_id: UUID, db: Session = Depends(get_db)):
    """Delete loan product (admin)."""
    deleted = service.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# ============================================================================
# Rate Model Endpoints
# ============================================================================

@router.get("/{product_id}/rates", response_model=schemas.RateModelResponse)
def get_product_rates(product_id: UUID, db: Session = Depends(get_db)):
    """Get rate model for a product."""
    rate_model = db.query(RateModel).filter(RateModel.loan_product_id == product_id).first()
    if not rate_model:
        raise HTTPException(status_code=404, detail="Rate model not found for this product")
    return rate_model


@router.post("/{product_id}/rates", response_model=schemas.RateModelResponse)
def create_product_rates(
    product_id: UUID,
    rate_model: schemas.RateModelCreate,
    db: Session = Depends(get_db)
):
    """Create rate model for a product (admin)."""
    # Check product exists
    product = db.query(LoanProduct).filter(LoanProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if rate model already exists
    existing = db.query(RateModel).filter(RateModel.loan_product_id == product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rate model already exists for this product. Use PUT to update.")
    
    # Create rate model
    db_rate_model = RateModel(
        loan_product_id=product_id,
        promo_options=[opt.model_dump() for opt in rate_model.promo_options] if rate_model.promo_options else [],
        floating=rate_model.floating.model_dump() if rate_model.floating else {},
        reference_rate_base_pct=rate_model.reference_rate_base_pct,
        notes=rate_model.notes,
        assumptions=rate_model.assumptions,
    )
    db.add(db_rate_model)
    db.commit()
    db.refresh(db_rate_model)
    
    return db_rate_model


@router.put("/{product_id}/rates", response_model=schemas.RateModelResponse)
def update_product_rates(
    product_id: UUID,
    rate_model: schemas.RateModelCreate,
    db: Session = Depends(get_db)
):
    """Update rate model for a product (admin)."""
    db_rate_model = db.query(RateModel).filter(RateModel.loan_product_id == product_id).first()
    if not db_rate_model:
        raise HTTPException(status_code=404, detail="Rate model not found for this product")
    
    db_rate_model.promo_options = [opt.model_dump() for opt in rate_model.promo_options] if rate_model.promo_options else []
    db_rate_model.floating = rate_model.floating.model_dump() if rate_model.floating else {}
    db_rate_model.reference_rate_base_pct = rate_model.reference_rate_base_pct
    db_rate_model.notes = rate_model.notes
    db_rate_model.assumptions = rate_model.assumptions
    
    db.commit()
    db.refresh(db_rate_model)
    
    return db_rate_model


@router.delete("/{product_id}/rates")
def delete_product_rates(product_id: UUID, db: Session = Depends(get_db)):
    """Delete rate model for a product (admin)."""
    db_rate_model = db.query(RateModel).filter(RateModel.loan_product_id == product_id).first()
    if not db_rate_model:
        raise HTTPException(status_code=404, detail="Rate model not found for this product")
    
    db.delete(db_rate_model)
    db.commit()
    
    return {"message": "Rate model deleted successfully"}


# ============================================================================
# Fees & Penalties Endpoints
# ============================================================================

@router.get("/{product_id}/fees", response_model=schemas.FeesPenaltiesResponse)
def get_product_fees(product_id: UUID, db: Session = Depends(get_db)):
    """Get fees structure for a product."""
    fees = db.query(FeesPenalties).filter(FeesPenalties.loan_product_id == product_id).first()
    if not fees:
        raise HTTPException(status_code=404, detail="Fees structure not found for this product")
    return fees


@router.post("/{product_id}/fees", response_model=schemas.FeesPenaltiesResponse)
def create_product_fees(
    product_id: UUID,
    fees: schemas.FeesPenaltiesCreate,
    db: Session = Depends(get_db)
):
    """Create fees structure for a product (admin)."""
    # Check product exists
    product = db.query(LoanProduct).filter(LoanProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if fees already exist
    existing = db.query(FeesPenalties).filter(FeesPenalties.loan_product_id == product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fees structure already exists for this product. Use PUT to update.")
    
    # Create fees
    db_fees = FeesPenalties(
        loan_product_id=product_id,
        upfront=fees.upfront.model_dump() if fees.upfront else {},
        recurring=fees.recurring.model_dump() if fees.recurring else {},
        prepayment=fees.prepayment.model_dump() if fees.prepayment else {},
        late_overdue=fees.late_overdue.model_dump() if fees.late_overdue else {},
        notes=fees.notes,
    )
    db.add(db_fees)
    db.commit()
    db.refresh(db_fees)
    
    return db_fees


@router.put("/{product_id}/fees", response_model=schemas.FeesPenaltiesResponse)
def update_product_fees(
    product_id: UUID,
    fees: schemas.FeesPenaltiesCreate,
    db: Session = Depends(get_db)
):
    """Update fees structure for a product (admin)."""
    db_fees = db.query(FeesPenalties).filter(FeesPenalties.loan_product_id == product_id).first()
    if not db_fees:
        raise HTTPException(status_code=404, detail="Fees structure not found for this product")
    
    db_fees.upfront = fees.upfront.model_dump() if fees.upfront else {}
    db_fees.recurring = fees.recurring.model_dump() if fees.recurring else {}
    db_fees.prepayment = fees.prepayment.model_dump() if fees.prepayment else {}
    db_fees.late_overdue = fees.late_overdue.model_dump() if fees.late_overdue else {}
    db_fees.notes = fees.notes
    
    db.commit()
    db.refresh(db_fees)
    
    return db_fees


@router.delete("/{product_id}/fees")
def delete_product_fees(product_id: UUID, db: Session = Depends(get_db)):
    """Delete fees structure for a product (admin)."""
    db_fees = db.query(FeesPenalties).filter(FeesPenalties.loan_product_id == product_id).first()
    if not db_fees:
        raise HTTPException(status_code=404, detail="Fees structure not found for this product")
    
    db.delete(db_fees)
    db.commit()
    
    return {"message": "Fees structure deleted successfully"}


# ============================================================================
# Source Audit Endpoints
# ============================================================================

@router.get("/sources/bank/{bank_id}", response_model=List[schemas.SourceAuditResponse])
def get_bank_sources(bank_id: UUID, db: Session = Depends(get_db)):
    """Get source audits for a bank."""
    sources = db.query(SourceAudit).filter(SourceAudit.bank_id == bank_id).all()
    return sources


@router.get("/sources/product/{product_id}", response_model=List[schemas.SourceAuditResponse])
def get_product_sources(product_id: UUID, db: Session = Depends(get_db)):
    """Get source audits for a product."""
    sources = db.query(SourceAudit).filter(SourceAudit.loan_product_id == product_id).all()
    return sources


@router.post("/sources", response_model=schemas.SourceAuditResponse)
def create_source_audit(
    source: schemas.SourceAuditCreate,
    db: Session = Depends(get_db)
):
    """Create a source audit record (admin)."""
    if not source.bank_id and not source.loan_product_id:
        raise HTTPException(status_code=400, detail="Either bank_id or loan_product_id must be provided")
    
    import hashlib
    
    db_source = SourceAudit(
        bank_id=source.bank_id,
        loan_product_id=source.loan_product_id,
        source_type=SourceType(source.source_type),
        source_url=source.source_url,
        raw_text_snapshot=source.raw_text_snapshot,
        html_pdf_hash=hashlib.sha256(source.raw_text_snapshot.encode()).hexdigest() if source.raw_text_snapshot else None,
        notes=source.notes,
    )
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    
    return db_source


@router.patch("/sources/{source_id}/verify")
def verify_source(
    source_id: UUID,
    verified_by: str,
    db: Session = Depends(get_db)
):
    """Mark a source as verified (admin)."""
    source = db.query(SourceAudit).filter(SourceAudit.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source audit not found")
    
    from datetime import datetime
    source.verified_by = verified_by
    source.verified_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Source verified", "verified_at": source.verified_at}
