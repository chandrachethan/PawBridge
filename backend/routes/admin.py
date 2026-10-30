"""Moderator-only database viewer, handy for demos and diagrams."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import models
from auth import require_roles
from database import Base, get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])
HIDDEN = {"password_hash"}


def _cell(v):
    if v is None or isinstance(v, (int, float, bool)):
        return v
    if isinstance(v, (list, dict)):
        return str(v)
    return str(v)[:160]


@router.get("/tables")
def tables(_: models.User = Depends(require_roles("moderator")), db: Session = Depends(get_db)):
    out = {}
    for name, table in Base.metadata.tables.items():
        cols = [c for c in table.columns if c.name not in HIDDEN]
        rows = db.execute(table.select().order_by(table.c.id.desc()).limit(200)).mappings().all()
        out[name] = {"columns": [c.name for c in cols],
                     "rows": [[_cell(r[c.name]) for c in cols] for r in rows],
                     "total": db.execute(select(func.count()).select_from(table)).scalar()}
    return out
