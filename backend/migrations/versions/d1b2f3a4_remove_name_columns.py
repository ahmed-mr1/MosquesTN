"""Remove 'name' columns from mosques and mosque_suggestions

Revision ID: d1b2f3a4
Revises: 707d26a692c4
Create Date: 2026-01-11 00:00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd1b2f3a4'
down_revision = '707d26a692c4'
branch_labels = None
depends_on = None


def upgrade():
    # Drop 'name' from mosques if exists
    try:
        op.drop_column('mosques', 'name')
    except Exception:
        pass
    # Drop 'name' from mosque_suggestions if exists
    try:
        op.drop_column('mosque_suggestions', 'name')
    except Exception:
        pass


def downgrade():
    # Recreate 'name' columns (nullable to ease rollback)
    try:
        op.add_column('mosques', sa.Column('name', sa.String(length=255), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('mosque_suggestions', sa.Column('name', sa.String(length=255), nullable=True))
    except Exception:
        pass
