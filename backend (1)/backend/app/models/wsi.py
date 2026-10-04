"""
Water-Stress Index models — the backend home for the logic currently in the
frontend's src/lib/wsi.ts (normalize, entropyWeights, computeWsi). Porting
that logic into a service that writes these tables is Phase 2C; this phase
only creates the tables it will write to.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin

WEIGHTING_METHODS = ("entropy", "equal", "custom")
RUN_STATUSES = ("pending", "running", "succeeded", "failed")


class WsiConfig(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "wsi_config"
    __table_args__ = (
        CheckConstraint(f"weighting_method IN {WEIGHTING_METHODS}", name="ck_wsi_config_method"),
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    weighting_method: Mapped[str] = mapped_column(String(20), nullable=False)
    indicator_set: Mapped[dict] = mapped_column(JSONB, nullable=False)
    missing_policy: Mapped[dict] = mapped_column(JSONB, default=dict)
    min_confidence_threshold: Mapped[float | None] = mapped_column(Numeric(4, 3))
    created_by: Mapped[str | None] = mapped_column(String(120))

    runs: Mapped[list["WsiRun"]] = relationship(back_populates="config")


class WsiRun(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "wsi_run"
    __table_args__ = (
        CheckConstraint(f"status IN {RUN_STATUSES}", name="ck_wsi_run_status"),
    )

    wsi_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wsi_config.id"), nullable=False
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    input_dataset_version_ids: Mapped[list[uuid.UUID] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True))
    )
    code_version: Mapped[str | None] = mapped_column(String(40))
    content_hash: Mapped[str | None] = mapped_column(String(64))
    computed_weights: Mapped[dict | None] = mapped_column(JSONB)

    config: Mapped["WsiConfig"] = relationship(back_populates="runs")
    indicator_values: Mapped[list["WsiIndicatorValue"]] = relationship(back_populates="run")
    scores: Mapped[list["WsiScore"]] = relationship(back_populates="run")


class WsiIndicatorValue(Base, UUIDPKMixin):
    __tablename__ = "wsi_indicator_value"

    wsi_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wsi_run.id"), nullable=False
    )
    ward_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ward.id"), nullable=False)
    variable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("variable_definition.id"), nullable=False
    )
    raw_value: Mapped[float | None] = mapped_column(Numeric(14, 4))
    normalized_value: Mapped[float | None] = mapped_column(Numeric(6, 5))
    weight_applied: Mapped[float | None] = mapped_column(Numeric(6, 5))
    confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    was_imputed: Mapped[bool] = mapped_column(default=False)

    run: Mapped["WsiRun"] = relationship(back_populates="indicator_values")


class WsiScore(Base, UUIDPKMixin):
    __tablename__ = "wsi_score"

    wsi_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wsi_run.id"), nullable=False
    )
    ward_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ward.id"), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(6, 5), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    synthetic_share: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)

    run: Mapped["WsiRun"] = relationship(back_populates="scores")
