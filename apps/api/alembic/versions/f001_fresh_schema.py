"""Fresh schema for Mortgage MVP - complete overhaul

This migration drops all existing tables and creates a comprehensive
schema for the mortgage product aggregation and recommendation platform.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "f001_fresh_schema"
down_revision = None  # Fresh start - no dependencies
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ===== Drop existing tables if they exist (in reverse dependency order) =====
    op.execute("DROP TABLE IF EXISTS recommendation_runs CASCADE")
    op.execute("DROP TABLE IF EXISTS source_audits CASCADE")
    op.execute("DROP TABLE IF EXISTS fees_penalties CASCADE")
    op.execute("DROP TABLE IF EXISTS rate_models CASCADE")
    op.execute("DROP TABLE IF EXISTS application_collaterals CASCADE")
    op.execute("DROP TABLE IF EXISTS application_debts CASCADE")
    op.execute("DROP TABLE IF EXISTS application_incomes CASCADE")
    op.execute("DROP TABLE IF EXISTS applications CASCADE")
    op.execute("DROP TABLE IF EXISTS loan_products CASCADE")
    op.execute("DROP TABLE IF EXISTS banks CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
    
    # Drop existing enums
    op.execute("DROP TYPE IF EXISTS applicationstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS proofstrength CASCADE")
    op.execute("DROP TYPE IF EXISTS incometype CASCADE")
    op.execute("DROP TYPE IF EXISTS collateraltype CASCADE")
    op.execute("DROP TYPE IF EXISTS legalstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS banktype CASCADE")
    op.execute("DROP TYPE IF EXISTS loanpurpose CASCADE")
    op.execute("DROP TYPE IF EXISTS repaymentmethod CASCADE")
    op.execute("DROP TYPE IF EXISTS paymentfrequency CASCADE")
    op.execute("DROP TYPE IF EXISTS sourcetype CASCADE")

    # ===== Create Enums =====
    op.execute("""
        CREATE TYPE banktype AS ENUM ('SOCB', 'PRIVATE', 'FOREIGN')
    """)
    op.execute("""
        CREATE TYPE loanpurpose AS ENUM (
            'HOME_PURCHASE', 'CONSTRUCTION', 'REPAIR', 
            'REFINANCE', 'DEBT_SWAP', 'BUSINESS_SECURED'
        )
    """)
    op.execute("""
        CREATE TYPE repaymentmethod AS ENUM ('annuity', 'equal_principal')
    """)
    op.execute("""
        CREATE TYPE paymentfrequency AS ENUM ('monthly', 'quarterly')
    """)
    op.execute("""
        CREATE TYPE applicationstatus AS ENUM (
            'DRAFT', 'SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED'
        )
    """)
    op.execute("""
        CREATE TYPE proofstrength AS ENUM ('STRONG', 'MEDIUM', 'WEAK')
    """)
    op.execute("""
        CREATE TYPE incometype AS ENUM ('SALARY', 'BUSINESS', 'RENTAL', 'OTHER')
    """)
    op.execute("""
        CREATE TYPE collateraltype AS ENUM (
            'HOUSE', 'LAND', 'APT', 'OFF_PLAN', 'COMMERCIAL', 'OTHER'
        )
    """)
    op.execute("""
        CREATE TYPE legalstatus AS ENUM ('CLEAR', 'PENDING', 'DISPUTED')
    """)
    op.execute("""
        CREATE TYPE sourcetype AS ENUM ('WEB', 'PDF', 'MANUAL')
    """)

    # ===== Users Table =====
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # ===== Banks Table =====
    op.create_table(
        "banks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("short_name", sa.String(), nullable=False),
        sa.Column("bank_type", postgresql.ENUM("SOCB", "PRIVATE", "FOREIGN", name="banktype", create_type=False), 
                  nullable=False, server_default="PRIVATE"),
        # Contact and presence
        sa.Column("logo_url", sa.String(), nullable=True),
        sa.Column("official_site", sa.String(), nullable=True),
        sa.Column("contact_hotline", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("coverage_provinces", postgresql.JSONB(), nullable=True, server_default="[]"),
        # Processing SLA
        sa.Column("processing_sla", postgresql.JSONB(), nullable=True, server_default="{}"),
        # Data sourcing and verification
        sa.Column("source_urls", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column("last_verified_at", sa.DateTime(), nullable=True),
        sa.Column("last_crawled_at", sa.DateTime(), nullable=True),
        sa.Column("data_confidence_score", sa.Integer(), nullable=True, server_default="50"),
        # Status
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        # Metadata
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # ===== Loan Products Table =====
    op.create_table(
        "loan_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("bank_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("banks.id"), nullable=False),
        # Basic info
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("purpose", postgresql.ENUM(
            "HOME_PURCHASE", "CONSTRUCTION", "REPAIR", 
            "REFINANCE", "DEBT_SWAP", "BUSINESS_SECURED",
            name="loanpurpose", create_type=False
        ), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_segment", postgresql.JSONB(), nullable=True, server_default="[]"),
        # Currency and validity
        sa.Column("currency", sa.String(), nullable=False, server_default="VND"),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("effective_to", sa.Date(), nullable=True),
        # Loan amount constraints
        sa.Column("min_loan_amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("max_loan_amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("max_ltv_pct", sa.Numeric(5, 2), nullable=True),
        # Term constraints
        sa.Column("min_term_months", sa.Integer(), nullable=True),
        sa.Column("max_term_months", sa.Integer(), nullable=True),
        sa.Column("max_age_at_maturity", sa.Integer(), nullable=True),
        # Complex fields as JSONB
        sa.Column("eligibility", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("collateral", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("repayment", postgresql.JSONB(), nullable=True, server_default="{}"),
        # Legacy fields for backward compatibility
        sa.Column("rate_fixed_months", sa.Integer(), nullable=True),
        sa.Column("rate_fixed", sa.Numeric(5, 2), nullable=True),
        sa.Column("floating_margin", sa.Numeric(5, 2), nullable=True),
        sa.Column("reference_rate_name", sa.String(), nullable=True),
        sa.Column("constraints_json", postgresql.JSONB(), nullable=True),
        sa.Column("sla_days_estimate", sa.Integer(), nullable=True),
        sa.Column("reference_url", sa.String(), nullable=True),
        # Status
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        # Metadata
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_loan_products_bank_id", "loan_products", ["bank_id"])
    op.create_index("ix_loan_products_purpose", "loan_products", ["purpose"])

    # ===== Rate Models Table =====
    op.create_table(
        "rate_models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("loan_product_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("loan_products.id", ondelete="CASCADE"), nullable=False, unique=True),
        # Rate structure
        sa.Column("promo_options", postgresql.JSONB(), nullable=True, server_default="[]"),
        sa.Column("floating", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("reference_rate_base_pct", sa.Numeric(5, 2), nullable=True, server_default="5.0"),
        # Documentation
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assumptions", sa.Text(), nullable=True),
        # Metadata
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # ===== Fees & Penalties Table =====
    op.create_table(
        "fees_penalties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("loan_product_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("loan_products.id", ondelete="CASCADE"), nullable=False, unique=True),
        # Fee structures
        sa.Column("upfront", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("recurring", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("prepayment", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("late_overdue", postgresql.JSONB(), nullable=True, server_default="{}"),
        # Documentation
        sa.Column("notes", sa.Text(), nullable=True),
        # Metadata
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # ===== Source Audits Table =====
    op.create_table(
        "source_audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("bank_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("banks.id", ondelete="CASCADE"), nullable=True),
        sa.Column("loan_product_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("loan_products.id", ondelete="CASCADE"), nullable=True),
        # Source information
        sa.Column("source_type", postgresql.ENUM("WEB", "PDF", "MANUAL", name="sourcetype", create_type=False), 
                  nullable=False),
        sa.Column("source_url", sa.String(), nullable=True),
        # Raw content
        sa.Column("raw_text_snapshot", sa.Text(), nullable=True),
        sa.Column("html_pdf_hash", sa.String(), nullable=True),
        sa.Column("page_version_hash", sa.String(), nullable=True),
        # Verification
        sa.Column("crawled_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("verified_by", sa.String(), nullable=True),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_source_audits_bank_id", "source_audits", ["bank_id"])
    op.create_index("ix_source_audits_loan_product_id", "source_audits", ["loan_product_id"])

    # ===== Applications Table =====
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        # Loan details
        sa.Column("purpose", sa.String(), nullable=False),
        sa.Column("loan_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("tenor_months", sa.Integer(), nullable=False),
        # Property/Purchase details
        sa.Column("purchase_price_vnd", sa.Numeric(18, 2), nullable=True),
        sa.Column("down_payment_vnd", sa.Numeric(18, 2), nullable=True),
        # Comparison and prepayment planning
        sa.Column("planned_hold_months", sa.Integer(), nullable=True),
        sa.Column("expected_prepayment_month", sa.Integer(), nullable=True),
        sa.Column("expected_prepayment_amount_vnd", sa.Numeric(18, 2), nullable=True),
        # Timing
        sa.Column("need_disbursement_by_date", sa.Date(), nullable=True),
        # Location
        sa.Column("geo_location", sa.String(), nullable=True),
        # Borrower profile
        sa.Column("income_type", postgresql.ENUM("SALARY", "BUSINESS", "RENTAL", "OTHER", 
                  name="incometype", create_type=False), nullable=True),
        sa.Column("monthly_income_vnd", sa.Numeric(18, 2), nullable=True),
        sa.Column("proof_strength", postgresql.ENUM("STRONG", "MEDIUM", "WEAK", 
                  name="proofstrength", create_type=False), nullable=True),
        sa.Column("existing_debts_monthly_payment_vnd", sa.Numeric(18, 2), nullable=True),
        sa.Column("credit_flags", postgresql.JSONB(), nullable=True, server_default="{}"),
        # Property details
        sa.Column("property_type", postgresql.ENUM("HOUSE", "LAND", "APT", "OFF_PLAN", "COMMERCIAL", "OTHER",
                  name="collateraltype", create_type=False), nullable=True),
        sa.Column("property_location_province", sa.String(), nullable=True),
        sa.Column("property_location_district", sa.String(), nullable=True),
        sa.Column("legal_status", postgresql.ENUM("CLEAR", "PENDING", "DISPUTED",
                  name="legalstatus", create_type=False), nullable=True),
        sa.Column("estimated_property_value_vnd", sa.Numeric(18, 2), nullable=True),
        # Preferences
        sa.Column("preferences", postgresql.JSONB(), nullable=True, server_default="{}"),
        # Legacy
        sa.Column("stuck_reasons", postgresql.JSONB(), nullable=True),
        # Status
        sa.Column("status", postgresql.ENUM("DRAFT", "SUBMITTED", "PROCESSING", "APPROVED", "REJECTED",
                  name="applicationstatus", create_type=False), nullable=False, server_default="DRAFT"),
        # Metadata
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_status", "applications", ["status"])

    # ===== Application Incomes Table =====
    op.create_table(
        "application_incomes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("monthly_net", sa.Numeric(18, 2), nullable=False),
        sa.Column("proof_type", sa.String(), nullable=True),
        sa.Column("proof_strength", postgresql.ENUM("STRONG", "MEDIUM", "WEAK",
                  name="proofstrength", create_type=False), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_application_incomes_application_id", "application_incomes", ["application_id"])

    # ===== Application Debts Table =====
    op.create_table(
        "application_debts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("debt_type", sa.String(), nullable=False),
        sa.Column("monthly_payment", sa.Numeric(18, 2), nullable=False),
        sa.Column("outstanding_balance", sa.Numeric(18, 2), nullable=True),
        sa.Column("remaining_months", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_application_debts_application_id", "application_debts", ["application_id"])

    # ===== Application Collaterals Table =====
    op.create_table(
        "application_collaterals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("collateral_type", sa.String(), nullable=False),
        sa.Column("estimated_value", sa.Numeric(18, 2), nullable=False),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("district", sa.String(), nullable=True),
        sa.Column("legal_status", postgresql.ENUM("CLEAR", "PENDING", "DISPUTED",
                  name="legalstatus", create_type=False), nullable=True),
        sa.Column("property_age_years", sa.Integer(), nullable=True),
        sa.Column("has_red_book", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_application_collaterals_application_id", "application_collaterals", ["application_id"])

    # ===== Recommendation Runs Table =====
    op.create_table(
        "recommendation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("application_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("top_recommendations", postgresql.JSONB(), nullable=False),
        sa.Column("rejected_products", postgresql.JSONB(), nullable=False),
        sa.Column("scenarios", postgresql.JSONB(), nullable=True, server_default="{}"),
        sa.Column("generated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_recommendation_runs_application_id", "recommendation_runs", ["application_id"])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table("recommendation_runs")
    op.drop_table("application_collaterals")
    op.drop_table("application_debts")
    op.drop_table("application_incomes")
    op.drop_table("applications")
    op.drop_table("source_audits")
    op.drop_table("fees_penalties")
    op.drop_table("rate_models")
    op.drop_table("loan_products")
    op.drop_table("banks")
    op.drop_table("users")
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS sourcetype")
    op.execute("DROP TYPE IF EXISTS legalstatus")
    op.execute("DROP TYPE IF EXISTS collateraltype")
    op.execute("DROP TYPE IF EXISTS incometype")
    op.execute("DROP TYPE IF EXISTS proofstrength")
    op.execute("DROP TYPE IF EXISTS applicationstatus")
    op.execute("DROP TYPE IF EXISTS paymentfrequency")
    op.execute("DROP TYPE IF EXISTS repaymentmethod")
    op.execute("DROP TYPE IF EXISTS loanpurpose")
    op.execute("DROP TYPE IF EXISTS banktype")

