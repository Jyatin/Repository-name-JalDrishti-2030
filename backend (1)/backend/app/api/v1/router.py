"""
Aggregates every v1 endpoint router. Phase 2A only wires up health; each later
phase (2C WSI, 2D forecast) adds an `api_router.include_router(...)` line
here, not a change to main.py.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
