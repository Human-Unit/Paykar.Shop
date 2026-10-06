"""Persist explicit curated product connections."""

import sqlalchemy as sa

from alembic import op

revision = "0003_product_connections"
down_revision = "0002_sandbox_payments"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "product_connections",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "source_product_id",
            sa.BigInteger(),
            sa.ForeignKey("products.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "target_product_id",
            sa.BigInteger(),
            sa.ForeignKey("products.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("relation_type", sa.Text(), nullable=False, server_default="complementary"),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint(
            "source_product_id <> target_product_id", name="ck_product_connections_distinct"
        ),
        sa.CheckConstraint("relation_type = 'complementary'", name="ck_product_connections_type"),
        sa.CheckConstraint("position >= 0", name="ck_product_connections_position"),
        sa.UniqueConstraint(
            "source_product_id", "target_product_id", name="uq_product_connections_pair"
        ),
    )
    op.create_index(
        "ix_product_connections_source_active_position",
        "product_connections",
        ["source_product_id", "is_active", "position"],
    )


def downgrade():
    op.drop_index("ix_product_connections_source_active_position", table_name="product_connections")
    op.drop_table("product_connections")
