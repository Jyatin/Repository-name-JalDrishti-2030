"""
Ward — the spatial unit everything else joins against.

geom is a PostGIS MultiPolygon in WGS84 (SRID 4326), matching exactly what the
frontend's schematic lattice already uses (frontend src/data/wards.ts). When
real BBMP/GBA boundaries replace the schematic lattice, this column's shape
does not change — only where the rows come from.
"""

from geoalchemy2 import Geometry
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class Ward(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "ward"

    ward_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str | None] = mapped_column(String(200))
    scheme_year: Mapped[int | None] = mapped_column(Integer)
    is_schematic: Mapped[bool] = mapped_column(default=True)
    zone: Mapped[str | None] = mapped_column(String(20))

    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False
    )

    population: Mapped[int | None] = mapped_column(Integer)
    connections: Mapped[int | None] = mapped_column(Integer)
