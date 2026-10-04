"""
Importing this package registers every model on app.core.database.Base.

Two things depend on that completeness:
  1. Alembic's env.py imports this package, then autogenerates against
     Base.metadata — a model not imported here is invisible to migrations.
  2. Cross-file relationship() string references (e.g. Observation's
     Mapped["VariableDefinition"]) are resolved against this shared registry
     at mapper-configuration time, not at each file's own import time — so
     every model must be imported somewhere before the app queries anything.
"""

from app.models.forecast import ForecastMetric, ForecastModel, ForecastRun, ForecastValue
from app.models.intervention import InterventionCandidate, InterventionType
from app.models.observation import Observation
from app.models.provenance import (
    AvailabilityAssessment,
    DataSource,
    DatasetVersion,
    IngestionRun,
    SyntheticRecipe,
    VariableDefinition,
)
from app.models.ward import Ward
from app.models.wsi import WsiConfig, WsiIndicatorValue, WsiRun, WsiScore

__all__ = [
    "ForecastMetric",
    "ForecastModel",
    "ForecastRun",
    "ForecastValue",
    "InterventionCandidate",
    "InterventionType",
    "Observation",
    "AvailabilityAssessment",
    "DataSource",
    "DatasetVersion",
    "IngestionRun",
    "SyntheticRecipe",
    "VariableDefinition",
    "Ward",
    "WsiConfig",
    "WsiIndicatorValue",
    "WsiRun",
    "WsiScore",
]
