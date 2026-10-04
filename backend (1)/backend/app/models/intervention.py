"""
Intervention library — schema only in Phase 2A. Nothing writes to these
tables yet; the optimisation engine that would (Phase 3, NSGA-II via pymoo)
is explicitly out of scope for this phase. Structure mirrors the paper's
Table 4 and the frontend's src/data/interventions.ts -> INTERVENTIONS.
"""

import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin
from app.models.provenance import SPATIAL_LEVELS

COST_BANDS = ("low", "low_medium", "medium", "high")


class InterventionType(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "intervention_type"
    __table_args__ = (
        CheckConstraint(f"cost_band IN {COST_BANDS}", name="ck_intervention_type_cost_band"),
    )

    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    mechanism_description: Mapped[str] = mapped_column(Text, nullable=False)
    cost_band: Mapped[str] = mapped_column(String(20), nullable=False)
    applicability_rule: Mapped[dict] = mapped_column(JSONB, default=dict)
    equity_note: Mapped[str | None] = mapped_column(Text)
    requires_hydraulic_eval: Mapped[bool] = mapped_column(Boolean, default=False)

    candidates: Mapped[list["InterventionCandidate"]] = relationship(back_populates="intervention_type")


class InterventionCandidate(Base, UUIDPKMixin, TimestampMixin):
    """A specific ward/node-scoped application of an intervention type.
    Effect size and cost are intentionally nullable + unconfidenced until a
    real estimation method exists — the paper gives cost bands, not figures
    (Table 4), so nothing here should carry a number without a dataset_version
    behind it once this table is actually written to."""

    __tablename__ = "intervention_candidate"
    __table_args__ = (
        CheckConstraint(f"scope_type IN {SPATIAL_LEVELS}", name="ck_intervention_candidate_scope_type"),
    )

    intervention_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("intervention_type.id"), nullable=False
    )
    scope_type: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    est_cost: Mapped[float | None] = mapped_column(Numeric(14, 2))
    cost_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    cost_is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    effect_params: Mapped[dict] = mapped_column(JSONB, default=dict)
    effect_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))

    intervention_type: Mapped["InterventionType"] = relationship(back_populates="candidates")
