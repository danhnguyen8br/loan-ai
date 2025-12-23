"""Add repayment_strategy and current_outstanding_balance to applications

Revision ID: c07b1fb62d8e
Revises: f001_fresh_schema
Create Date: 2025-12-22 14:00:18.906460

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c07b1fb62d8e'
down_revision = 'f001_fresh_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum type first
    repayment_strategy_enum = sa.Enum('UNCERTAIN', 'EARLY_EXIT', 'LONG_HOLD', name='repaymentstrategy')
    repayment_strategy_enum.create(op.get_bind(), checkfirst=True)
    
    # Add new columns
    op.add_column('applications', sa.Column('repayment_strategy', repayment_strategy_enum, nullable=True))
    op.add_column('applications', sa.Column('current_outstanding_balance_vnd', sa.Numeric(precision=18, scale=2), nullable=True))
    
    # Make tenor_months nullable (now auto-calculated based on strategy)
    op.alter_column('applications', 'tenor_months',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    # Revert tenor_months to NOT NULL (set a default first)
    op.execute("UPDATE applications SET tenor_months = 180 WHERE tenor_months IS NULL")
    op.alter_column('applications', 'tenor_months',
               existing_type=sa.INTEGER(),
               nullable=False)
    
    # Drop columns
    op.drop_column('applications', 'current_outstanding_balance_vnd')
    op.drop_column('applications', 'repayment_strategy')
    
    # Drop enum type
    sa.Enum('UNCERTAIN', 'EARLY_EXIT', 'LONG_HOLD', name='repaymentstrategy').drop(op.get_bind(), checkfirst=True)
