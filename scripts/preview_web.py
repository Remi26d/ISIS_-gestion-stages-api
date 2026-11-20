"""Prévisualisation de l’interface avec une base de démonstration séparée."""

import argparse
import os
import sys
from pathlib import Path
from tempfile import gettempdir

import uvicorn

if __name__ == "__main__":
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("--host", default="127.0.0.1")
    arguments.add_argument("--port", type=int, default=4173)
    arguments.add_argument("--strictPort", action="store_true")
    options = arguments.parse_args()
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    os.environ.setdefault(
        "DATABASE_PATH", str(Path(gettempdir()) / "isis-stages-preview.sqlite3")
    )
    uvicorn.run("app.main:app", host=options.host, port=options.port)
