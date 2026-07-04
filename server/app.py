#!/usr/bin/env python3
"""
TruthStrike Community Relay — prototype

The OPTIONAL community layer. The extension is fully functional without it;
this server only ever handles what users explicitly choose to publish:
community annotations, votes, and trusted-reporter flags.

Privacy architecture (non-negotiables):
  * Content is addressed by SHA-256 of canonical URL — the server can serve
    annotations for a page without learning your browsing (the client hashes;
    the server only ever sees hashes for pages someone chose to annotate or
    look up, plus standard transport metadata — run it behind an onion service
    or a trusted host to minimize even that).
  * No accounts for readers. Writing uses pseudonymous keypairs generated
    client-side; the server stores public keys only.
  * Trusted reporters are verified out-of-band (by the instance operator —
    a local newsroom, a press association) and their key gets a badge.
    Verification is a human process by design.
  * Aggregate trend stats are released with Laplace noise (ε=1.0) so
    small-count queries don't leak who flagged what.
  * Whistleblowing is explicitly NOT handled here. Rolling our own would be
    malpractice. The API returns pointers to SecureDrop/GlobaLeaks instances.

Run: pip install fastapi uvicorn && uvicorn app:app --port 8321
"""

import hashlib
import json
import math
import random
import sqlite3
import time
from contextlib import closing

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB = "community.db"
EPSILON = 1.0  # differential-privacy budget for trend queries

app = FastAPI(title="TruthStrike Community Relay", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(db()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS annotations (
                id INTEGER PRIMARY KEY,
                url_hash TEXT NOT NULL,            -- sha256 of canonical URL, hashed client-side
                body TEXT NOT NULL CHECK(length(body) <= 2000),
                sources TEXT NOT NULL DEFAULT '[]',-- JSON array of citation URLs
                author_pubkey TEXT NOT NULL,
                author_sig TEXT NOT NULL,          -- ed25519 over (url_hash|body|sources), verified client-side too
                created_at REAL NOT NULL,
                score INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_ann_url ON annotations(url_hash);
            CREATE TABLE IF NOT EXISTS votes (
                annotation_id INTEGER NOT NULL,
                voter_pubkey TEXT NOT NULL,
                value INTEGER NOT NULL CHECK(value IN (-1, 1)),
                PRIMARY KEY (annotation_id, voter_pubkey)
            );
            CREATE TABLE IF NOT EXISTS reporters (
                pubkey TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                outlet TEXT NOT NULL,
                verified_by TEXT NOT NULL,         -- operator note: how identity was verified
                verified_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS trend_events (
                day TEXT NOT NULL,                 -- YYYY-MM-DD only; no timestamps
                technique TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (day, technique)
            );
            """
        )
        conn.commit()


init_db()


class Annotation(BaseModel):
    url_hash: str = Field(pattern=r"^[a-f0-9]{64}$")
    body: str = Field(min_length=10, max_length=2000)
    sources: list[str] = Field(default_factory=list, max_length=5)
    author_pubkey: str = Field(min_length=32, max_length=128)
    author_sig: str = Field(min_length=32, max_length=256)


class Vote(BaseModel):
    annotation_id: int
    voter_pubkey: str = Field(min_length=32, max_length=128)
    value: int = Field(ge=-1, le=1)


class TrendReport(BaseModel):
    """Opt-in anonymous aggregate: 'my device flagged technique X today'."""
    day: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    techniques: list[str] = Field(max_length=20)


@app.post("/api/annotations")
def create_annotation(a: Annotation):
    if not all(s.startswith("https://") for s in a.sources):
        raise HTTPException(400, "sources must be https URLs")
    with closing(db()) as conn:
        cur = conn.execute(
            "INSERT INTO annotations (url_hash, body, sources, author_pubkey, author_sig, created_at)"
            " VALUES (?,?,?,?,?,?)",
            (a.url_hash, a.body, json.dumps(a.sources), a.author_pubkey, a.author_sig, time.time()),
        )
        conn.commit()
        return {"id": cur.lastrowid}


@app.get("/api/annotations/{url_hash}")
def get_annotations(url_hash: str):
    if len(url_hash) != 64:
        raise HTTPException(400, "bad hash")
    with closing(db()) as conn:
        rows = conn.execute(
            """SELECT a.*, r.display_name, r.outlet,
                      (r.pubkey IS NOT NULL) AS verified
               FROM annotations a
               LEFT JOIN reporters r ON r.pubkey = a.author_pubkey
               WHERE a.url_hash = ?
               ORDER BY verified DESC, a.score DESC, a.created_at DESC
               LIMIT 50""",
            (url_hash,),
        ).fetchall()
        return [
            {
                "id": r["id"], "body": r["body"], "sources": json.loads(r["sources"]),
                "score": r["score"], "created_at": r["created_at"],
                "verified_reporter": bool(r["verified"]),
                "reporter": {"name": r["display_name"], "outlet": r["outlet"]} if r["verified"] else None,
            }
            for r in rows
        ]


@app.post("/api/votes")
def vote(v: Vote):
    if v.value == 0:
        raise HTTPException(400, "value must be -1 or 1")
    with closing(db()) as conn:
        conn.execute(
            "INSERT INTO votes (annotation_id, voter_pubkey, value) VALUES (?,?,?)"
            " ON CONFLICT(annotation_id, voter_pubkey) DO UPDATE SET value=excluded.value",
            (v.annotation_id, v.voter_pubkey, v.value),
        )
        conn.execute(
            "UPDATE annotations SET score = (SELECT COALESCE(SUM(value),0) FROM votes WHERE annotation_id=?)"
            " WHERE id=?",
            (v.annotation_id, v.annotation_id),
        )
        conn.commit()
    return {"ok": True}


@app.post("/api/trends/report")
def report_trend(t: TrendReport):
    """Client sends at most one report per day, containing only technique ids."""
    with closing(db()) as conn:
        for tech in t.techniques:
            conn.execute(
                "INSERT INTO trend_events (day, technique, count) VALUES (?,?,1)"
                " ON CONFLICT(day, technique) DO UPDATE SET count = count + 1",
                (t.day, tech[:40]),
            )
        conn.commit()
    return {"ok": True}


@app.get("/api/trends/{day}")
def get_trends(day: str):
    """DP-noised daily counts: what techniques are surging, community-wide."""
    with closing(db()) as conn:
        rows = conn.execute(
            "SELECT technique, count FROM trend_events WHERE day = ?", (day,)
        ).fetchall()

    def laplace(scale: float) -> float:
        u = random.random() - 0.5
        return -scale * math.copysign(math.log(1 - 2 * abs(u)), u)

    return {
        "day": day,
        "epsilon": EPSILON,
        "counts": {
            r["technique"]: max(0, round(r["count"] + laplace(1.0 / EPSILON))) for r in rows
        },
    }


@app.get("/api/whistleblow")
def whistleblow_pointers():
    """We do not accept leaks. Use infrastructure built and audited for it."""
    return {
        "message": "TruthStrike does not accept whistleblower submissions. "
                   "Use a dedicated, audited system — from a device and network not associated with your workplace.",
        "directories": [
            {"name": "SecureDrop directory (verified instances)", "url": "https://securedrop.org/directory/"},
            {"name": "GlobaLeaks", "url": "https://www.globaleaks.org/"},
            {"name": "Freedom of the Press Foundation guides", "url": "https://freedom.press/training/"},
        ],
    }


@app.get("/api/health")
def health():
    return {"ok": True, "service": "truthstrike-community-relay", "version": "0.1.0"}
