"""Grocery sale units and immutable measurement snapshots; retain stock in price units."""

import sqlalchemy as sa

from alembic import op

revision = "0005_grocery_measurement"
down_revision = "0004_administration"
branch_labels = None
depends_on = None


def upgrade():
    for column in [
        sa.Column("measurement_mode", sa.Text(), nullable=False, server_default="PIECE"),
        sa.Column("price_unit", sa.Text(), nullable=False, server_default="PIECE"),
        sa.Column("average_piece_weight_g", sa.Integer()),
        sa.Column("quantity_step", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("minimum_quantity", sa.Integer(), nullable=False, server_default="1"),
    ]:
        op.add_column("products", column)
    op.create_check_constraint(
        "product_measurement_mode", "products", "measurement_mode IN ('PIECE', 'WEIGHT', 'DUAL')"
    )
    op.create_check_constraint(
        "product_measurement_step", "products", "quantity_step > 0 AND minimum_quantity > 0"
    )
    op.create_check_constraint(
        "product_measurement_configuration",
        "products",
        "(measurement_mode = 'PIECE' AND price_unit = 'PIECE' "
        "AND average_piece_weight_g IS NULL AND quantity_step = 1 AND minimum_quantity <= 99) "
        "OR (measurement_mode = 'WEIGHT' AND price_unit = 'KG' "
        "AND average_piece_weight_g IS NULL) "
        "OR (measurement_mode = 'DUAL' AND price_unit = 'KG' "
        "AND average_piece_weight_g > 0 AND average_piece_weight_g IS NOT NULL)",
    )
    for column in [
        sa.Column("purchase_mode", sa.Text(), nullable=False, server_default="PIECE"),
        sa.Column("requested_piece_count", sa.Integer()),
        sa.Column("requested_weight_g", sa.Integer()),
        sa.Column("estimated_weight_g", sa.Integer()),
        sa.Column("average_piece_weight_g_snapshot", sa.Integer()),
        sa.Column("price_unit_snapshot", sa.Text(), nullable=False, server_default="PIECE"),
        sa.Column("actual_weight_g", sa.Integer()),
        sa.Column("is_estimated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    ]:
        op.add_column("order_items", column)
    op.create_check_constraint(
        "order_item_actual_weight", "order_items", "actual_weight_g IS NULL OR actual_weight_g > 0"
    )
    # Never reinterpret historical order quantities using today's product settings.
    op.execute(
        "UPDATE order_items SET requested_piece_count = quantity::integer "
        "WHERE quantity = trunc(quantity) AND quantity <= 99"
    )
    # Explicitly opt in only the known one-kilogram demo SKU; no name-based inference.
    # Fourteen one-kg packs retain fourteen kg of physical inventory and the same price.
    op.execute(
        "UPDATE products SET measurement_mode = 'DUAL', price_unit = 'KG', "
        "average_piece_weight_g = 180, quantity_step = 100, minimum_quantity = 100, unit = "
        "'кг', name = 'Бананы', description = 'Демонстрационный весовой товар. Средний вес "
        "одного банана для расчёта — 180 г. Цена и вес при выборе штук приблизительные; "
        "изображение иллюстративное.' WHERE sku = 'DEMO-002' AND slug = 'bananas' AND unit = "
        "'упак.'"
    )


def downgrade():
    # Restore the known demo's former one-kg package label before removing its mode.
    # Deliberately changed measurement settings are not silently reclassified.
    op.execute(
        "UPDATE products SET unit = 'упак.' WHERE sku = 'DEMO-002' AND slug = 'bananas' "
        "AND unit = 'кг' AND measurement_mode = 'DUAL' AND price_unit = 'KG' "
        "AND average_piece_weight_g = 180 AND quantity_step = 100 AND minimum_quantity = 100"
    )
    op.drop_constraint("order_item_actual_weight", "order_items", type_="check")
    for name in [
        "is_estimated",
        "actual_weight_g",
        "price_unit_snapshot",
        "average_piece_weight_g_snapshot",
        "estimated_weight_g",
        "requested_weight_g",
        "requested_piece_count",
        "purchase_mode",
    ]:
        op.drop_column("order_items", name)
    for name in [
        "product_measurement_configuration",
        "product_measurement_step",
        "product_measurement_mode",
    ]:
        op.drop_constraint(name, "products", type_="check")
    for name in [
        "minimum_quantity",
        "quantity_step",
        "average_piece_weight_g",
        "price_unit",
        "measurement_mode",
    ]:
        op.drop_column("products", name)
