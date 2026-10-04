"""
Provenance layer — the database-level enforcement of JalDrishti's honesty rule.

Every observation traces to a dataset_version; every dataset_version declares
whether it is synthetic and what resolution grade it earned. This mirrors the
frontend's existing GradeChip / SyntheticTag system exactly (see
frontend PROJECT_CONTEXT.md §4, §9) — the backend is not inventing a new
vocabulary, it's making the frontend's vocabulary queryable.
"""

import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin

ACCESS_TIERS = ("public", "authorized", "synthetic")
GRADES = ("A", "B", "C", "D", "E")
SPATIAL_LEVELS = ("ward", "dma", "node", "station", "city")
VARIABLE_CATEGORIES = (
    "consumption",
    "groundwater",
    "rainfall",
    "supply",
    "loss",
    "demographic",
    "spatial",
    "index",
    "forecast",
    "other",
)
DIRECTIONS = ("stress_increasing", "stress_decreasing")


class DataSource(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "data_source"
    __table_args__ = (
        CheckConstraint(f"access_tier IN {ACCESS_TIERS}", name="ck_data_source_access_tier"),
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    publisher: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500))
    licence: Mapped[str | None] = mapped_column(String(200))
    access_tier: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    dataset_versions: Mapped[list["DatasetVersion"]] = relationship(back_populates="data_source")


class VariableDefinition(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "variable_definition"
    __table_args__ = (
        CheckConstraint(f"direction IN {DIRECTIONS}", name="ck_variable_direction"),
        CheckConstraint(f"category IN {VARIABLE_CATEGORIES}", name="ck_variable_category"),
        CheckConstraint(
            f"required_resolution IN {SPATIAL_LEVELS}", name="ck_variable_required_resolution"
        ),
    )

    code: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(40))
    direction: Mapped[str] = mapped_column(String(20), nullable=False)
    required_resolution: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    availability_assessments: Mapped[list["AvailabilityAssessment"]] = relationship(
        back_populates="variable"
    )
    dataset_versions: Mapped[list["DatasetVersion"]] = relationship(back_populates="variable")
    observations: Mapped[list["Observation"]] = relationship(back_populates="variable")


class AvailabilityAssessment(Base, UUIDPKMixin, TimestampMixin):
    """The paper's Phase 2 audit (Table 3), as rows rather than a static table
    in the frontend. See frontend src/data/catalogue.ts -> AVAILABILITY_AUDIT
    for the values this table is meant to eventually replace."""

    __tablename__ = "availability_assessment"
    __table_args__ = (
        CheckConstraint(f"grade IN {GRADES}", name="ck_availability_grade"),
        CheckConstraint(
            f"spatial_level IN {SPATIAL_LEVELS}", name="ck_availability_spatial_level"
        ),
    )

    variable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("variable_definition.id"), nullable=False
    )
    spatial_level: Mapped[str] = mapped_column(String(20), nullable=False)
    grade: Mapped[str] = mapped_column(String(1), nullable=False)
    limitation_note: Mapped[str] = mapped_column(Text, nullable=False)
    assessed_on: Mapped[str | None] = mapped_column(String(20))

    variable: Mapped["VariableDefinition"] = relationship(
        back_populates="availability_assessments"
    )


class SyntheticRecipe(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "synthetic_recipe"

    generator_name: Mapped[str] = mapped_column(String(120), nullable=False)
    generator_version: Mapped[str] = mapped_column(String(40), nullable=False)
    params: Mapped[dict] = mapped_column(JSONB, default=dict)
    seed: Mapped[int | None] = mapped_column(Integer)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)

    dataset_versions: Mapped[list["DatasetVersion"]] = relationship(back_populates="synthetic_recipe")


class DatasetVersion(Base, UUIDPKMixin, TimestampMixin):
    """The unit of provenance: every observation points at exactly one of
    these. is_synthetic is NOT NULL and has no default on purpose — nothing
    can be written without declaring what it is."""

    __tablename__ = "dataset_version"
    __table_args__ = (
        CheckConstraint(f"grade IN {GRADES}", name="ck_dataset_version_grade"),
    )

    data_source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_source.id"), nullable=False
    )
    variable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("variable_definition.id"), nullable=False
    )
    version_label: Mapped[str] = mapped_column(String(60), nullable=False)
    spatial_resolution: Mapped[str] = mapped_column(String(20), nullable=False)
    temporal_resolution: Mapped[str | None] = mapped_column(String(40))
    grade: Mapped[str] = mapped_column(String(1), nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, nullable=False)
    synthetic_recipe_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("synthetic_recipe.id")
    )
    row_count: Mapped[int | None] = mapped_column(Integer)
    content_hash: Mapped[str | None] = mapped_column(String(64))

    data_source: Mapped["DataSource"] = relationship(back_populates="dataset_versions")
    variable: Mapped["VariableDefinition"] = relationship(back_populates="dataset_versions")
    synthetic_recipe: Mapped["SyntheticRecipe | None"] = relationship(
        back_populates="dataset_versions"
    )
    observations: Mapped[list["Observation"]] = relationship(back_populates="dataset_version")
    ingestion_runs: Mapped[list["IngestionRun"]] = relationship(back_populates="dataset_version")


class IngestionRun(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "ingestion_run"

    dataset_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dataset_version.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    records_in: Mapped[int | None] = mapped_column(Integer)
    records_rejected: Mapped[int | None] = mapped_column(Integer)
    error_log: Mapped[dict | None] = mapped_column(JSONB)

    dataset_version: Mapped["DatasetVersion"] = relationship(back_populates="ingestion_runs")


# NOTE: "Observation" above is resolved as a string forward-reference by
# SQLAlchemy's mapper registry, not by import — it only needs to exist
# somewhere on the same Base by the time mappers configure. See
# app/models/__init__.py, which imports every model module exactly so this
# resolution has something to find without a circular import here.
