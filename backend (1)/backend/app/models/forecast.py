"""
Forecasting models — the backend home for the logic currently in the
frontend's src/lib/forecast.ts (baseline vs. candidate, chronological
validation). Table shape enforces the paper's rule at the schema level:
forecast_metric is per-fold AND optionally per-ward, so "beats baseline on
average but fails in groundwater-dependent wards" (paper §5.3) is a query,
not something that has to be remembered.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin

MODEL_FAMILIES = ("persistence", "seasonal_naive", "damped_trend", "gbdt", "lstm")
VALIDATION_SCHEMES = ("holdout", "rolling_origin")
METRIC_NAMES = ("mae", "rmse", "mape", "stress_class_f1")


class ForecastModel(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "forecast_model"
    __table_args__ = (
        CheckConstraint(f"family IN {MODEL_FAMILIES}", name="ck_forecast_model_family"),
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    family: Mapped[str] = mapped_column(String(30), nullable=False)
    hyperparams: Mapped[dict] = mapped_column(JSONB, default=dict)
    code_version: Mapped[str | None] = mapped_column(String(40))
    artifact_uri: Mapped[str | None] = mapped_column(String(500))

    runs: Mapped[list["ForecastRun"]] = relationship(back_populates="model")


class ForecastRun(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "forecast_run"
    __table_args__ = (
        CheckConstraint(
            f"validation_scheme IN {VALIDATION_SCHEMES}", name="ck_forecast_run_validation_scheme"
        ),
    )

    forecast_model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forecast_model.id"), nullable=False
    )
    target_variable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("variable_definition.id"), nullable=False
    )
    train_start: Mapped[date] = mapped_column(Date, nullable=False)
    train_end: Mapped[date] = mapped_column(Date, nullable=False)
    horizon_periods: Mapped[int] = mapped_column(Integer, nullable=False)
    validation_scheme: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    content_hash: Mapped[str | None] = mapped_column(String(64))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    model: Mapped["ForecastModel"] = relationship(back_populates="runs")
    values: Mapped[list["ForecastValue"]] = relationship(back_populates="run")
    metrics: Mapped[list["ForecastMetric"]] = relationship(back_populates="run")


class ForecastValue(Base, UUIDPKMixin):
    __tablename__ = "forecast_value"

    forecast_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forecast_run.id"), nullable=False
    )
    ward_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ward.id"), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    predicted: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    lower_80: Mapped[float | None] = mapped_column(Numeric(14, 4))
    upper_80: Mapped[float | None] = mapped_column(Numeric(14, 4))
    confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))

    run: Mapped["ForecastRun"] = relationship(back_populates="values")


class ForecastMetric(Base, UUIDPKMixin):
    __tablename__ = "forecast_metric"
    __table_args__ = (
        CheckConstraint(f"metric IN {METRIC_NAMES}", name="ck_forecast_metric_name"),
    )

    forecast_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forecast_run.id"), nullable=False
    )
    # NULL ward_id = aggregate metric across all wards; populated = per-ward
    # error analysis, per the paper's §5.3 requirement.
    ward_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ward.id"))
    fold_index: Mapped[int | None] = mapped_column(Integer)
    metric: Mapped[str] = mapped_column(String(20), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(14, 6), nullable=False)
    is_baseline: Mapped[bool] = mapped_column(default=False)

    run: Mapped["ForecastRun"] = relationship(back_populates="metrics")
