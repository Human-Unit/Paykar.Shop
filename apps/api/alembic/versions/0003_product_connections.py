"""Curated product connections for shopping assistance."""

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
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "target_product_id",
            sa.BigInteger(),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "relation_type",
            sa.Text(),
            nullable=False,
            server_default="complementary",
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.CheckConstraint(
            "source_product_id <> target_product_id",
            name="ck_product_connections_not_self",
        ),
        sa.CheckConstraint(
            "relation_type IN ('complementary', 'substitute')",
            name="ck_product_connections_relation_type",
        ),
        sa.CheckConstraint("position >= 0", name="ck_product_connections_position"),
        sa.UniqueConstraint(
            "source_product_id",
            "target_product_id",
            "relation_type",
            name="uq_product_connections_pair_type",
        ),
    )
    op.create_index(
        "ix_product_connections_source_product_id",
        "product_connections",
        ["source_product_id"],
    )
    op.create_index(
        "ix_product_connections_target_product_id",
        "product_connections",
        ["target_product_id"],
    )


def downgrade():
    op.drop_index("ix_product_connections_target_product_id", table_name="product_connections")
    op.drop_index("ix_product_connections_source_product_id", table_name="product_connections")
    op.drop_table("product_connections")
