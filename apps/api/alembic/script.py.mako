<% import json %>"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""

import sqlalchemy as sa  # noqa: F401

from alembic import op  # noqa: F401
% if imports:
${imports}
% endif

revision = ${json.dumps(up_revision)}
down_revision = ${json.dumps(down_revision) if down_revision is not None else "None"}
branch_labels = ${json.dumps(branch_labels) if branch_labels is not None else "None"}
depends_on = ${json.dumps(depends_on) if depends_on is not None else "None"}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
