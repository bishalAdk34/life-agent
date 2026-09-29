"""add task priority

Revision ID: a1b2c3d4e5f6
Revises: 9c3eb0cbaef8
Create Date: 2026-09-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9c3eb0cbaef8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the enum type
    task_priority_enum = sa.Enum('low', 'normal', 'high', name='task_priority')
    task_priority_enum.create(op.get_bind(), checkfirst=True)

    # Add the column with default value
    op.add_column(
        'tasks',
        sa.Column(
            'priority',
            task_priority_enum,
            nullable=False,
            server_default='normal'
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tasks', 'priority')
    sa.Enum(name='task_priority').drop(op.get_bind(), checkfirst=True)
