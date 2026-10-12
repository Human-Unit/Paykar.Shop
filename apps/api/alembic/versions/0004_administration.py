"""Admin sessions, design versions and the existing public store directory."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0004_administration"
down_revision = "0003_product_connections"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "admin_users",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("role IN ('ADMIN', 'MASTER')"),
    )
    op.create_table(
        "admin_sessions",
        sa.Column("token_hash", sa.Text(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("admin_users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("csrf", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_sessions_user_id", "admin_sessions", ["user_id"])
    op.create_index("ix_admin_sessions_expires_at", "admin_sessions", ["expires_at"])
    op.create_table(
        "admin_login_limits",
        sa.Column("key", sa.Text(), primary_key=True),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_login_limits_expires_at", "admin_login_limits", ["expires_at"])
    op.create_table(
        "design_configs",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("version", sa.Integer(), nullable=False, unique=True),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("config", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_by",
            sa.Integer(),
            sa.ForeignKey("admin_users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')"),
    )
    op.create_index(
        "one_published_design",
        "design_configs",
        ["status"],
        unique=True,
        postgresql_where=sa.text("status = 'PUBLISHED'"),
    )
    op.create_table(
        "admin_audit",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column(
            "actor_id",
            sa.Integer(),
            sa.ForeignKey("admin_users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("target", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    stores = op.create_table(
        "stores",
        sa.Column("id", sa.Integer(), sa.Identity(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("short_address", sa.Text(), nullable=False),
        sa.Column("city", sa.Text(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90"),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180"),
    )
    # Exact pre-admin directory snapshot. No geocoding or invented store metadata.
    addresses = [
        ("ул. Айни 16б", "Айни 16б", 38.562512, 68.791511),
        ("ул. Бухоро 27", "Бухоро 27", 38.56845, 68.786229),
        ("ул. Яккачинор 148", "Яккачинор 148", 38.567245, 68.755381),
        ("ул. Айни 57", "Айни 57", 38.563584, 68.80999),
        ("пр. Рудаки 66", "Рудаки 66", 38.579079, 68.78781),
        ("ул. Бободжон Гафуров 10/б, 112 мкр.", "Б. Гафуров 10/б", 38.589605, 68.740783),
        ("ул. Борбад 101", "Борбад 101", 38.5263, 68.748033),
        ("ул. С. Носира 25", "С. Носира 25", 38.594824, 68.782061),
    ]
    op.bulk_insert(
        stores,
        [
            {
                "name": f"Пайкар {i}",
                "address": a,
                "short_address": s,
                "city": "Душанбе",
                "latitude": lat,
                "longitude": lon,
            }
            for i, (a, s, lat, lon) in enumerate(addresses, 1)
        ],
    )


def downgrade():
    for table in (
        "stores",
        "admin_audit",
        "design_configs",
        "admin_login_limits",
        "admin_sessions",
        "admin_users",
    ):
        op.drop_table(table)
