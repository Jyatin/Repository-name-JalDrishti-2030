"""
Observation — the single fact table behind consumption, groundwater, rainfall,
supply, loss and demographic data.

Design note (see backend README §Schema decisions): rather than one table per
variable type, every measured value is a row here, distinguished by
variable_id (which carries its own `category`). Adding a new indicator later
is one new variable_definition row, not a migration.
"""

import uuid
from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin
from app.models.provenance import SPATIAL_LEVELS


class Observation(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "observation"
    __table_args__ = (
        CheckConstraint(f"spatial_unit_type IN {SPATIAL_LEVELS}", name="ck_observation_spatial_unit_type"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_observation_confidence_range"),
    )

    variable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("variable_definition.id"), nullable=False
    )
    dataset_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dataset_version.id"), nullable=False
    )

    # Polymorphic spatial reference: spatial_unit_type says which kind of id
    # spatial_unit_id points at (ward, dma, node, station, city). No FK
    # constraint on spatial_unit_id itself since it can target different
    # tables — the frontend's own AVAILABILITY_AUDIT uses the same pattern.
    spatial_unit_type: Mapped[str] = mapped_column(String(20), nullable=False)
    spatial_unit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    value: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    is_imputed: Mapped[bool] = mapped_column(Boolean, default=False)
    imputation_method: Mapped[str | None] = mapped_column(String(60))

    variable: Mapped["VariableDefinition"] = relationship(back_populates="observations")  # noqa: F821
    dataset_version: Mapped["DatasetVersion"] = relationship(back_populates="observations")  # noqa: F821
