"""
Seed data for Mortgage MVP - Vietnamese bank products

This script seeds the database with realistic Vietnamese bank data,
mortgage products, rate models, and fee structures.
"""
import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from datetime import datetime, date
from decimal import Decimal
import uuid

from app.core.database import SessionLocal, engine, Base
from app.models.bank import Bank, BankType
from app.models.loan_product import LoanProduct, LoanPurpose
from app.models.rate_model import RateModel
from app.models.fees_penalties import FeesPenalties
from app.models.user import User


def create_banks(db: Session) -> dict:
    """Create Vietnamese bank entries."""
    banks_data = [
        {
            "name": "Ngân hàng Thương mại Cổ phần Ngoại thương Việt Nam",
            "short_name": "Vietcombank",
            "bank_type": BankType.SOCB,
            "official_site": "https://vietcombank.com.vn",
            "contact_hotline": "1900 545 413",
            "description": "Một trong 4 ngân hàng thương mại nhà nước lớn nhất Việt Nam",
            "coverage_provinces": ["HCM", "HN", "DN", "HP", "CT", "BD", "BN", "TH", "NA", "HT"],
            "processing_sla": {
                "pre_approval_days": 3,
                "appraisal_days": 5,
                "final_approval_days": 3,
                "disbursement_days": 2
            },
            "data_confidence_score": 85,
        },
        {
            "name": "Ngân hàng Thương mại Cổ phần Công Thương Việt Nam",
            "short_name": "VietinBank",
            "bank_type": BankType.SOCB,
            "official_site": "https://vietinbank.vn",
            "contact_hotline": "1900 6161",
            "description": "Ngân hàng TMCP hàng đầu Việt Nam",
            "coverage_provinces": ["HCM", "HN", "DN", "HP", "CT", "BD", "BN", "TH"],
            "processing_sla": {
                "pre_approval_days": 3,
                "appraisal_days": 5,
                "final_approval_days": 4,
                "disbursement_days": 2
            },
            "data_confidence_score": 80,
        },
        {
            "name": "Ngân hàng Thương mại Cổ phần Đầu tư và Phát triển Việt Nam",
            "short_name": "BIDV",
            "bank_type": BankType.SOCB,
            "official_site": "https://bidv.com.vn",
            "contact_hotline": "1900 9247",
            "description": "Ngân hàng có quy mô tài sản lớn nhất Việt Nam",
            "coverage_provinces": ["HCM", "HN", "DN", "HP", "CT", "BD", "BN", "TH", "NA", "HT", "QB"],
            "processing_sla": {
                "pre_approval_days": 2,
                "appraisal_days": 5,
                "final_approval_days": 3,
                "disbursement_days": 2
            },
            "data_confidence_score": 85,
        },
        {
            "name": "Ngân hàng Thương mại Cổ phần Kỹ Thương Việt Nam",
            "short_name": "Techcombank",
            "bank_type": BankType.PRIVATE,
            "official_site": "https://techcombank.com.vn",
            "contact_hotline": "1800 588 822",
            "description": "Ngân hàng tư nhân hàng đầu Việt Nam",
            "coverage_provinces": ["HCM", "HN", "DN", "HP", "CT", "BD"],
            "processing_sla": {
                "pre_approval_days": 2,
                "appraisal_days": 3,
                "final_approval_days": 2,
                "disbursement_days": 1
            },
            "data_confidence_score": 90,
        },
        {
            "name": "Ngân hàng Thương mại Cổ phần Việt Nam Thịnh Vượng",
            "short_name": "VPBank",
            "bank_type": BankType.PRIVATE,
            "official_site": "https://vpbank.com.vn",
            "contact_hotline": "1900 545 415",
            "description": "Ngân hàng bán lẻ hàng đầu Việt Nam",
            "coverage_provinces": ["HCM", "HN", "DN", "HP", "CT", "BD", "BN"],
            "processing_sla": {
                "pre_approval_days": 1,
                "appraisal_days": 3,
                "final_approval_days": 2,
                "disbursement_days": 1
            },
            "data_confidence_score": 85,
        },
        {
            "name": "Ngân hàng Thương mại Cổ phần Quân Đội",
            "short_name": "MB Bank",
            "bank_type": BankType.PRIVATE,
            "official_site": "https://mbbank.com.vn",
            "contact_hotline": "1900 545 426",
            "description": "Ngân hàng số tiên phong tại Việt Nam",
            "coverage_provinces": ["HCM", "HN", "DN", "HP", "CT", "BD", "BN", "TH"],
            "processing_sla": {
                "pre_approval_days": 2,
                "appraisal_days": 4,
                "final_approval_days": 2,
                "disbursement_days": 1
            },
            "data_confidence_score": 80,
        },
        {
            "name": "Ngân hàng Thương mại Cổ phần Á Châu",
            "short_name": "ACB",
            "bank_type": BankType.PRIVATE,
            "official_site": "https://acb.com.vn",
            "contact_hotline": "1900 545 486",
            "description": "Ngân hàng bán lẻ uy tín",
            "coverage_provinces": ["HCM", "HN", "DN", "CT", "BD"],
            "processing_sla": {
                "pre_approval_days": 2,
                "appraisal_days": 4,
                "final_approval_days": 3,
                "disbursement_days": 2
            },
            "data_confidence_score": 75,
        },
        {
            "name": "Ngân hàng TNHH MTV HSBC Việt Nam",
            "short_name": "HSBC VN",
            "bank_type": BankType.FOREIGN,
            "official_site": "https://hsbc.com.vn",
            "contact_hotline": "1800 588 880",
            "description": "Ngân hàng nước ngoài hàng đầu tại Việt Nam",
            "coverage_provinces": ["HCM", "HN"],
            "processing_sla": {
                "pre_approval_days": 3,
                "appraisal_days": 5,
                "final_approval_days": 5,
                "disbursement_days": 3
            },
            "data_confidence_score": 90,
        },
    ]
    
    banks = {}
    for data in banks_data:
        bank = Bank(
            name=data["name"],
            short_name=data["short_name"],
            bank_type=data["bank_type"],
            official_site=data.get("official_site"),
            contact_hotline=data.get("contact_hotline"),
            description=data.get("description"),
            coverage_provinces=data.get("coverage_provinces", []),
            processing_sla=data.get("processing_sla", {}),
            data_confidence_score=data.get("data_confidence_score", 50),
            is_active=True,
            last_verified_at=datetime.utcnow(),
        )
        db.add(bank)
        db.flush()
        banks[data["short_name"]] = bank
    
    return banks


def create_products(db: Session, banks: dict) -> list:
    """Create loan products with rate models and fees."""
    products = []
    
    # Vietcombank products
    vcb_home = create_product_with_rates_fees(
        db,
        bank=banks["Vietcombank"],
        name="Vay Mua Nhà Ở Vietcombank",
        purpose=LoanPurpose.HOME_PURCHASE,
        description="Cho vay mua nhà ở, căn hộ chung cư với lãi suất ưu đãi",
        rate_fixed=6.5,
        rate_fixed_months=12,
        floating_margin=3.5,
        reference_rate_name="Lãi suất huy động 12 tháng",
        min_loan_amount=100000000,
        max_loan_amount=50000000000,
        max_ltv_pct=70,
        min_term_months=12,
        max_term_months=300,
        max_age_at_maturity=65,
        sla_days_estimate=13,
        promo_options=[
            {"option_name": "Ưu đãi cố định 12 tháng", "fixed_months": 12, "fixed_rate_pct": 6.5, "conditions_text": "Khoản vay từ 500 triệu"},
            {"option_name": "Ưu đãi cố định 24 tháng", "fixed_months": 24, "fixed_rate_pct": 7.0, "conditions_text": "Khoản vay từ 1 tỷ"},
        ],
        upfront_fees={
            "origination_fee_pct": 0.5,
            "origination_min_vnd": 500000,
            "origination_max_vnd": 30000000,
            "appraisal_fee_vnd": 2000000,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 3.0},
            {"months_from": 13, "months_to": 24, "fee_pct": 2.0},
            {"months_from": 25, "months_to": 36, "fee_pct": 1.0},
            {"months_from": 37, "months_to": None, "fee_pct": 0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS"],
            "min_income_vnd": 15000000,
            "employment_tenure_months": 12,
            "credit_requirements_text": "Không có nợ xấu trong 5 năm gần nhất",
        },
        collateral={
            "collateral_types": ["HOUSE", "APT", "LAND"],
            "legal_constraints_text": ["Sổ đỏ/sổ hồng đầy đủ", "Không tranh chấp"],
        },
        grace_principal_months=6,  # 6 tháng ân hạn nợ gốc
    )
    products.append(vcb_home)
    
    # Techcombank products
    tcb_home = create_product_with_rates_fees(
        db,
        bank=banks["Techcombank"],
        name="Home Loan Techcombank",
        purpose=LoanPurpose.HOME_PURCHASE,
        description="Vay mua nhà với quy trình duyệt nhanh",
        rate_fixed=5.99,
        rate_fixed_months=6,
        floating_margin=3.2,
        reference_rate_name="Lãi suất tham chiếu Techcombank",
        min_loan_amount=200000000,
        max_loan_amount=80000000000,
        max_ltv_pct=80,
        min_term_months=12,
        max_term_months=360,
        max_age_at_maturity=70,
        sla_days_estimate=8,
        promo_options=[
            {"option_name": "Fast Track 6 tháng", "fixed_months": 6, "fixed_rate_pct": 5.99, "conditions_text": "Khách hàng ưu tiên"},
            {"option_name": "Standard 12 tháng", "fixed_months": 12, "fixed_rate_pct": 6.5, "conditions_text": None},
            {"option_name": "Long Fixed 36 tháng", "fixed_months": 36, "fixed_rate_pct": 8.5, "conditions_text": "Khoản vay từ 2 tỷ"},
        ],
        upfront_fees={
            "origination_fee_pct": 0.3,
            "origination_min_vnd": 300000,
            "origination_max_vnd": 20000000,
            "appraisal_fee_vnd": 1500000,
        },
        recurring_fees={
            "insurance_annual_pct": 0.05,
            "mandatory_insurance_flag": True,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 2.0},
            {"months_from": 13, "months_to": None, "fee_pct": 0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS", "RENTAL"],
            "min_income_vnd": 10000000,
            "employment_tenure_months": 6,
            "required_relationships": [],
        },
        collateral={
            "collateral_types": ["HOUSE", "APT", "LAND", "OFF_PLAN"],
            "legal_constraints_text": ["Sổ đỏ/sổ hồng", "Hợp đồng mua bán đã công chứng (với OFF_PLAN)"],
        },
        grace_principal_months=3,  # 3 tháng ân hạn nợ gốc
    )
    products.append(tcb_home)
    
    # VPBank products
    vpb_home = create_product_with_rates_fees(
        db,
        bank=banks["VPBank"],
        name="VPBank Home Easy",
        purpose=LoanPurpose.HOME_PURCHASE,
        description="Vay mua nhà dễ dàng với điều kiện linh hoạt",
        rate_fixed=7.0,
        rate_fixed_months=12,
        floating_margin=3.8,
        reference_rate_name="Lãi suất huy động 12 tháng VPBank",
        min_loan_amount=100000000,
        max_loan_amount=30000000000,
        max_ltv_pct=75,
        min_term_months=12,
        max_term_months=240,
        max_age_at_maturity=65,
        sla_days_estimate=7,
        promo_options=[
            {"option_name": "Easy 12", "fixed_months": 12, "fixed_rate_pct": 7.0, "conditions_text": None},
            {"option_name": "Easy 24", "fixed_months": 24, "fixed_rate_pct": 7.5, "conditions_text": "Khoản vay từ 500 triệu"},
        ],
        upfront_fees={
            "origination_fee_pct": 0.5,
            "appraisal_fee_vnd": 1000000,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 6, "fee_pct": 3.0},
            {"months_from": 7, "months_to": 12, "fee_pct": 2.0},
            {"months_from": 13, "months_to": None, "fee_pct": 1.0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS", "RENTAL", "OTHER"],
            "min_income_vnd": 8000000,
        },
        collateral={
            "collateral_types": ["HOUSE", "APT", "LAND"],
        },
        grace_principal_months=12,  # 12 tháng ân hạn nợ gốc - linh hoạt nhất
    )
    products.append(vpb_home)
    
    # BIDV products
    bidv_home = create_product_with_rates_fees(
        db,
        bank=banks["BIDV"],
        name="BIDV Home Loan",
        purpose=LoanPurpose.HOME_PURCHASE,
        description="Cho vay mua nhà BIDV với lãi suất hấp dẫn",
        rate_fixed=6.8,
        rate_fixed_months=12,
        floating_margin=3.5,
        reference_rate_name="Lãi suất tham chiếu BIDV",
        min_loan_amount=100000000,
        max_loan_amount=60000000000,
        max_ltv_pct=70,
        min_term_months=12,
        max_term_months=300,
        max_age_at_maturity=60,
        sla_days_estimate=12,
        promo_options=[
            {"option_name": "Standard", "fixed_months": 12, "fixed_rate_pct": 6.8, "conditions_text": None},
            {"option_name": "Premium", "fixed_months": 24, "fixed_rate_pct": 7.2, "conditions_text": "Khoản vay từ 2 tỷ"},
        ],
        upfront_fees={
            "origination_fee_pct": 0.4,
            "appraisal_fee_vnd": 2500000,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 2.5},
            {"months_from": 13, "months_to": 24, "fee_pct": 1.5},
            {"months_from": 25, "months_to": None, "fee_pct": 0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS"],
            "min_income_vnd": 12000000,
            "employment_tenure_months": 12,
        },
        collateral={
            "collateral_types": ["HOUSE", "APT", "LAND"],
            "legal_constraints_text": ["Sổ đỏ đầy đủ"],
        },
        grace_principal_months=6,  # 6 tháng ân hạn nợ gốc
    )
    products.append(bidv_home)
    
    # MB Bank products
    mb_home = create_product_with_rates_fees(
        db,
        bank=banks["MB Bank"],
        name="MB Home Loan Express",
        purpose=LoanPurpose.HOME_PURCHASE,
        description="Vay mua nhà online nhanh chóng qua MB App",
        rate_fixed=6.2,
        rate_fixed_months=6,
        floating_margin=3.3,
        reference_rate_name="Lãi suất huy động 12 tháng MB",
        min_loan_amount=100000000,
        max_loan_amount=40000000000,
        max_ltv_pct=75,
        min_term_months=12,
        max_term_months=300,
        max_age_at_maturity=65,
        sla_days_estimate=9,
        promo_options=[
            {"option_name": "Express 6", "fixed_months": 6, "fixed_rate_pct": 6.2, "conditions_text": "Đăng ký qua MB App"},
            {"option_name": "Standard 12", "fixed_months": 12, "fixed_rate_pct": 6.8, "conditions_text": None},
        ],
        upfront_fees={
            "origination_fee_pct": 0.3,
            "appraisal_fee_vnd": 1500000,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 2.0},
            {"months_from": 13, "months_to": None, "fee_pct": 0.5},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS", "RENTAL"],
            "min_income_vnd": 10000000,
        },
        collateral={
            "collateral_types": ["HOUSE", "APT", "LAND", "OFF_PLAN"],
        },
        grace_principal_months=0,  # Không ân hạn - sản phẩm Express
    )
    products.append(mb_home)
    
    # ACB products
    acb_construction = create_product_with_rates_fees(
        db,
        bank=banks["ACB"],
        name="ACB Xây Dựng & Sửa Chữa",
        purpose=LoanPurpose.CONSTRUCTION,
        description="Cho vay xây dựng và sửa chữa nhà ở",
        rate_fixed=7.5,
        rate_fixed_months=12,
        floating_margin=4.0,
        reference_rate_name="Lãi suất huy động 12 tháng ACB",
        min_loan_amount=50000000,
        max_loan_amount=20000000000,
        max_ltv_pct=60,
        min_term_months=6,
        max_term_months=180,
        max_age_at_maturity=60,
        sla_days_estimate=11,
        promo_options=[
            {"option_name": "Construction", "fixed_months": 12, "fixed_rate_pct": 7.5, "conditions_text": None},
        ],
        upfront_fees={
            "origination_fee_pct": 0.5,
            "appraisal_fee_vnd": 2000000,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 2.0},
            {"months_from": 13, "months_to": None, "fee_pct": 1.0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS"],
            "min_income_vnd": 15000000,
        },
        collateral={
            "collateral_types": ["LAND", "HOUSE"],
            "legal_constraints_text": ["Giấy phép xây dựng", "Sổ đỏ đất"],
        },
        grace_principal_months=3,  # 3 tháng ân hạn nợ gốc
    )
    products.append(acb_construction)
    
    # VietinBank refinance
    vtb_refi = create_product_with_rates_fees(
        db,
        bank=banks["VietinBank"],
        name="VietinBank Refinance",
        purpose=LoanPurpose.REFINANCE,
        description="Tái cấp vốn với lãi suất ưu đãi",
        rate_fixed=6.9,
        rate_fixed_months=12,
        floating_margin=3.6,
        reference_rate_name="Lãi suất tham chiếu VietinBank",
        min_loan_amount=200000000,
        max_loan_amount=50000000000,
        max_ltv_pct=65,
        min_term_months=12,
        max_term_months=240,
        max_age_at_maturity=60,
        sla_days_estimate=14,
        promo_options=[
            {"option_name": "Refinance Standard", "fixed_months": 12, "fixed_rate_pct": 6.9, "conditions_text": None},
        ],
        upfront_fees={
            "origination_fee_pct": 0.4,
            "appraisal_fee_vnd": 2000000,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 2.0},
            {"months_from": 13, "months_to": None, "fee_pct": 0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS"],
            "min_income_vnd": 20000000,
            "credit_requirements_text": "Khoản vay hiện tại đang thanh toán đúng hạn",
        },
        collateral={
            "collateral_types": ["HOUSE", "APT"],
        },
        grace_principal_months=12,  # 12 tháng ân hạn - sản phẩm tái tài trợ
    )
    products.append(vtb_refi)
    
    # HSBC premium
    hsbc_home = create_product_with_rates_fees(
        db,
        bank=banks["HSBC VN"],
        name="HSBC Home Loan Premier",
        purpose=LoanPurpose.HOME_PURCHASE,
        description="Khoản vay cao cấp dành cho khách hàng Premier",
        rate_fixed=5.5,
        rate_fixed_months=12,
        floating_margin=2.8,
        reference_rate_name="LIBOR + biên độ",
        min_loan_amount=1000000000,
        max_loan_amount=100000000000,
        max_ltv_pct=75,
        min_term_months=12,
        max_term_months=360,
        max_age_at_maturity=70,
        sla_days_estimate=16,
        promo_options=[
            {"option_name": "Premier Fixed", "fixed_months": 12, "fixed_rate_pct": 5.5, "conditions_text": "Khách hàng Premier"},
            {"option_name": "Premier Fixed 24", "fixed_months": 24, "fixed_rate_pct": 6.0, "conditions_text": "Khách hàng Premier"},
        ],
        upfront_fees={
            "origination_fee_pct": 0.2,
            "origination_min_vnd": 2000000,
            "appraisal_fee_vnd": 3000000,
        },
        recurring_fees={
            "insurance_annual_pct": 0.03,
            "mandatory_insurance_flag": True,
        },
        prepayment_schedule=[
            {"months_from": 1, "months_to": 12, "fee_pct": 1.5},
            {"months_from": 13, "months_to": None, "fee_pct": 0},
        ],
        eligibility={
            "income_type_supported": ["SALARY", "BUSINESS", "RENTAL"],
            "min_income_vnd": 50000000,
            "credit_requirements_text": "Premier customer status required",
        },
        collateral={
            "collateral_types": ["HOUSE", "APT"],
            "legal_constraints_text": ["Bất động sản tại HCM hoặc HN"],
        },
        grace_principal_months=6,  # 6 tháng ân hạn nợ gốc - sản phẩm Premier
    )
    products.append(hsbc_home)
    
    return products


def create_product_with_rates_fees(
    db: Session,
    bank: Bank,
    name: str,
    purpose: LoanPurpose,
    description: str,
    rate_fixed: float,
    rate_fixed_months: int,
    floating_margin: float,
    reference_rate_name: str,
    min_loan_amount: int,
    max_loan_amount: int,
    max_ltv_pct: float,
    min_term_months: int,
    max_term_months: int,
    max_age_at_maturity: int,
    sla_days_estimate: int,
    promo_options: list,
    upfront_fees: dict,
    prepayment_schedule: list,
    eligibility: dict,
    collateral: dict,
    recurring_fees: dict = None,
    grace_principal_months: int = 0,  # Ân hạn nợ gốc (tháng)
) -> LoanProduct:
    """Create a product with associated rate model and fees."""
    # Create product
    product = LoanProduct(
        bank_id=bank.id,
        name=name,
        purpose=purpose,
        description=description,
        target_segment=["SALARIED", "BUSINESS_OWNER"],
        currency="VND",
        min_loan_amount=min_loan_amount,
        max_loan_amount=max_loan_amount,
        max_ltv_pct=Decimal(str(max_ltv_pct)),
        min_term_months=min_term_months,
        max_term_months=max_term_months,
        max_age_at_maturity=max_age_at_maturity,
        eligibility=eligibility,
        collateral=collateral,
        repayment={
            "repayment_method": "annuity",
            "payment_frequency": "monthly",
            "grace_principal_months": grace_principal_months,
            "grace_interest_months": 0,
        },
        rate_fixed_months=rate_fixed_months,
        rate_fixed=Decimal(str(rate_fixed)),
        floating_margin=Decimal(str(floating_margin)),
        reference_rate_name=reference_rate_name,
        sla_days_estimate=sla_days_estimate,
        is_active=True,
    )
    db.add(product)
    db.flush()
    
    # Create rate model
    rate_model = RateModel(
        loan_product_id=product.id,
        promo_options=promo_options,
        floating={
            "floating_index_name": reference_rate_name,
            "floating_margin_pct": floating_margin,
            "reset_frequency_months": 3,
        },
        reference_rate_base_pct=Decimal("5.0"),
        notes=f"Lãi suất áp dụng từ {datetime.now().strftime('%m/%Y')}",
        assumptions="Lãi suất tham chiếu giả định 5%/năm",
    )
    db.add(rate_model)
    
    # Create fees
    fees = FeesPenalties(
        loan_product_id=product.id,
        upfront=upfront_fees,
        recurring=recurring_fees or {},
        prepayment={"prepayment_schedule": prepayment_schedule},
        late_overdue={
            "late_payment_fee_rule": "150% lãi suất thông thường trên số tiền quá hạn",
            "overdue_interest_rule": "Lãi suất cơ bản + 2%/năm",
            "grace_days_before_late": 3,
        },
    )
    db.add(fees)
    
    return product


def create_admin_user(db: Session):
    """Create an admin user for testing (skip if exists)."""
    from passlib.context import CryptContext
    
    # Check if admin user already exists
    existing = db.query(User).filter(User.email == "admin@leadity.vn").first()
    if existing:
        print("   Admin user already exists, skipping...")
        return
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    admin = User(
        email="admin@leadity.vn",
        hashed_password=pwd_context.hash("admin123"),
        full_name="Admin User",
    )
    db.add(admin)


def seed_database():
    """Main function to seed the database."""
    db = SessionLocal()
    try:
        print("🌱 Starting database seed...")
        
        # Check if data already exists
        existing_banks = db.query(Bank).count()
        if existing_banks > 0:
            print("⚠️  Database already has data. Skipping seed.")
            print(f"   Found {existing_banks} banks")
            return
        
        # Create banks
        print("📦 Creating banks...")
        banks = create_banks(db)
        print(f"   Created {len(banks)} banks")
        
        # Create products
        print("📦 Creating products...")
        products = create_products(db, banks)
        print(f"   Created {len(products)} products")
        
        # Create admin user
        print("👤 Creating admin user...")
        create_admin_user(db)
        
        db.commit()
        print("✅ Database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
