"""Shared fixtures for backend tests.

Backend modules import each other flat (e.g. `import models`, `from models
import ZoneState`) instead of as a package, so the backend/ dir needs to be
on sys.path before anything under it is imported.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR.parent / "data"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(scope="session")
def nyj_venue() -> dict:
    with open(DATA_DIR / "venues" / "nyj.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def mia_venue() -> dict:
    with open(DATA_DIR / "venues" / "mia.json", encoding="utf-8") as f:
        return json.load(f)
