"""Print every table of the database. Handy to SHOW a request reached the database:
    python show_db.py            (all tables)
    python show_db.py adoption_requests notifications"""
import sqlite3
import sys

from config import DATABASE_DIR

conn = sqlite3.connect(str(DATABASE_DIR / "pawbridge.db"))
tables = [r[0] for r in conn.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
wanted = sys.argv[1:] or tables
for t in wanted:
    cols = [c[1] for c in conn.execute("PRAGMA table_info(%s)" % t) if c[1] != "password_hash"]
    rows = conn.execute("SELECT %s FROM %s ORDER BY id DESC LIMIT 50" % (", ".join(cols), t)).fetchall()
    print("\n== %s (%d shown) ==" % (t, len(rows)))
    print(" | ".join(cols))
    for r in rows:
        print(" | ".join(str(v)[:40] for v in r))
