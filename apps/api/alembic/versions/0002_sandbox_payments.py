"""Server-bound sandbox payment sessions and guest order idempotency."""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision = "0002_sandbox_payments"
down_revision = "0001_foundation"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "orders", sa.Column("payment_method", sa.Text(), nullable=False, server_default="cash")
    )
    op.add_column(
        "orders",
        sa.Column("payment_status", sa.Text(), nullable=False, server_default="due_on_delivery"),
    )
    op.add_column("orders", sa.Column("idempotency_key", sa.Uuid(), nullable=True))
    op.add_column("orders", sa.Column("request_fingerprint", sa.Text(), nullable=True))
    op.create_unique_constraint("uq_orders_idempotency_key", "orders", ["idempotency_key"])
    op.create_check_constraint(
        "ck_orders_payment_method", "orders", "payment_method IN ('cash', 'card')"
    )
    op.create_check_constraint(
        "ck_orders_payment_status", "orders", "payment_status IN ('due_on_delivery', 'paid')"
    )
    op.create_table(
        "payments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "order_id", sa.Uuid(), sa.ForeignKey("orders.id", ondelete="CASCADE"), unique=True
        ),
        sa.Column("idempotency_key", sa.Uuid(), nullable=False, unique=True),
        sa.Column("request_fingerprint", sa.Text(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False, server_default="sandbox"),
        sa.Column("method", sa.Text(), nullable=False, server_default="card"),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.Text(), nullable=False, server_default="TJS"),
        sa.Column("provider_reference", sa.Text()),
        sa.Column("failure_reason", sa.Text()),
        sa.Column("checkout", JSONB(), nullable=False),
        sa.Column("quote", JSONB(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint("amount >= 0"),
        sa.CheckConstraint("currency = 'TJS'"),
        sa.CheckConstraint("provider = 'sandbox' AND method = 'card'"),
        sa.CheckConstraint("status IN ('pending', 'succeeded', 'failed', 'cancelled')"),
        sa.CheckConstraint("order_id IS NULL OR status = 'succeeded'"),
    )


def downgrade():
    op.drop_table("payments")
    op.drop_constraint("ck_orders_payment_status", "orders")
    op.drop_constraint("ck_orders_payment_method", "orders")
    op.drop_constraint("uq_orders_idempotency_key", "orders")
    for name in ["request_fingerprint", "idempotency_key", "payment_status", "payment_method"]:
        op.drop_column("orders", name)
