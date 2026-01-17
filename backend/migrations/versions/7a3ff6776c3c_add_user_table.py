"""add user table

Revision ID: 7a3ff6776c3c
Revises: dbe689cd7e0e
Create Date: 2026-01-17 18:26:27.524289

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a3ff6776c3c'
down_revision = 'dbe689cd7e0e'
branch_labels = None
depends_on = None


def upgrade():
    # Handle case where table might already exist (locally) but not in production
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'users' not in inspector.get_table_names():
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('username', sa.String(length=80), nullable=False),
            sa.Column('password_hash', sa.String(length=200), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('username')
        )


def downgrade():
    op.drop_table('users')
