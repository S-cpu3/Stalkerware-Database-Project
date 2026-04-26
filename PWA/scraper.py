"""
Stalkerware IoC Web Scraper — SQLite version
============================================
Source: https://github.com/AssoEchap/stalkerware-indicators

Builds a local SQLite database at public/stalkerware_iocs.db so the PWA
can fetch it as a static asset. No .env, no server, no credentials.

Dependencies: requests, pyyaml
    pip install requests pyyaml
"""

import os
import sys
import csv
import io
import sqlite3
import requests
import yaml
from datetime import date

# ─── Output location ──────────────────────────────────────────────────────
# Place the DB where the PWA expects it (public/ is copied as-is by Vite).
HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(HERE, "public", "stalkerware_iocs.db")
SCHEMA_PATH = os.path.join(HERE, "schema.sql")

# ─── Source URLs (ECHAP GitHub via jsDelivr CDN mirror) ───────────────────
SOURCES = {
    "ioc.yaml": [
        "https://raw.githubusercontent.com/AssoEchap/stalkerware-indicators/master/ioc.yaml",
        "https://cdn.jsdelivr.net/gh/AssoEchap/stalkerware-indicators@master/ioc.yaml",
    ],
    "watchware.yaml": [
        "https://raw.githubusercontent.com/AssoEchap/stalkerware-indicators/master/watchware.yaml",
        "https://cdn.jsdelivr.net/gh/AssoEchap/stalkerware-indicators@master/watchware.yaml",
    ],
    "samples.csv": [
        "https://raw.githubusercontent.com/AssoEchap/stalkerware-indicators/master/samples.csv",
        "https://cdn.jsdelivr.net/gh/AssoEchap/stalkerware-indicators@master/samples.csv",
    ],
}

SOURCE_REFERENCE = "ECHAP-AssoEchap-GitHub"

IOC_TYPE_MAP = {
    "domains":      "domain",
    "packages":     "package_name",
    "certificates": "certificate",
    "sha256":       "file_hash",
    "filenames":    "filename",
    "processes":    "process_name",
    "emails":       "email",
    "ips":          "ip_address",
}

SEVERITY_MAP = {
    "certificate":  "High",
    "package_name": "High",
    "file_hash":    "High",
    "ip_address":   "High",
    "domain":       "Medium",
    "process_name": "Medium",
    "filename":     "Medium",
    "email":        "Low",
}

RELATIONSHIP_MAP = {
    "domain":       "communicates_with",
    "ip_address":   "connects_to",
    "package_name": "uses",
    "file_hash":    "drops",
    "certificate":  "signed_with",
    "filename":     "drops",
    "process_name": "runs",
    "email":        "registered_with",
}

# ─── Fetch ────────────────────────────────────────────────────────────────

def fetch_url(filename):
    urls = SOURCES[filename]
    headers = {"User-Agent": "Mozilla/5.0 (stalkerware-ioc-scraper)"}
    for url in urls:
        try:
            print(f"    Trying {url} ...")
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            print(f"    OK ({len(resp.content)} bytes)")
            return resp.text
        except Exception as e:
            print(f"    Failed: {e}")
    raise RuntimeError(f"Could not fetch {filename} from any source.")


# ─── DB helpers ───────────────────────────────────────────────────────────

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_or_insert_app(cur, app_name, platform, release_date):
    cur.execute("SELECT app_id FROM stalkerware_apps WHERE app_name = ?", (app_name,))
    row = cur.fetchone()
    if row:
        return row["app_id"]
    cur.execute(
        "INSERT INTO stalkerware_apps (app_name, platform, release_date) VALUES (?, ?, ?)",
        (app_name, platform, release_date.isoformat() if hasattr(release_date, "isoformat") else release_date),
    )
    return cur.lastrowid


def get_or_insert_ioc(cur, ioc_type, ioc_value, severity_level, date_identified):
    cur.execute(
        "SELECT ioc_id FROM iocs WHERE ioc_type = ? AND ioc_value = ?",
        (ioc_type, ioc_value),
    )
    row = cur.fetchone()
    if row:
        return row["ioc_id"]
    cur.execute(
        "INSERT INTO iocs (ioc_type, ioc_value, severity_level, date_identified) VALUES (?, ?, ?, ?)",
        (ioc_type, ioc_value, severity_level,
         date_identified.isoformat() if hasattr(date_identified, "isoformat") else date_identified),
    )
    return cur.lastrowid


def link_app_ioc(cur, app_id, ioc_id, relationship_type, source_reference):
    cur.execute(
        "SELECT app_ioc_id FROM app_ioc WHERE app_id = ? AND ioc_id = ?",
        (app_id, ioc_id),
    )
    if cur.fetchone():
        return
    cur.execute(
        "INSERT INTO app_ioc (relationship_type, source_reference, app_id, ioc_id) VALUES (?, ?, ?, ?)",
        (relationship_type, source_reference, app_id, ioc_id),
    )


# ─── Ingest YAML ──────────────────────────────────────────────────────────

def ingest_yaml(cur, filename, default_platform="Android"):
    print(f"\n  Fetching {filename} ...")
    raw = fetch_url(filename)
    entries = yaml.safe_load(raw)

    if not entries or not isinstance(entries, list):
        print(f"  [WARN] {filename} is empty or unexpected format.")
        return {"apps": 0, "iocs": 0, "links": 0}

    stats = {"apps": 0, "iocs": 0, "links": 0}
    today = date.today()

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        name = str(entry.get("name", "")).strip()
        if not name:
            continue

        has_packages = bool(entry.get("packages"))
        platform = "Android" if has_packages else default_platform

        app_id = get_or_insert_app(cur, name, platform, today)
        stats["apps"] += 1

        for yaml_key, ioc_type in IOC_TYPE_MAP.items():
            values = entry.get(yaml_key, [])
            if not values:
                continue
            if isinstance(values, str):
                values = [values]

            for value in values:
                value = str(value).strip()
                if not value:
                    continue

                severity     = SEVERITY_MAP.get(ioc_type, "Medium")
                relationship = RELATIONSHIP_MAP.get(ioc_type, "related_to")

                ioc_id = get_or_insert_ioc(cur, ioc_type, value, severity, today)
                stats["iocs"] += 1
                link_app_ioc(cur, app_id, ioc_id, relationship, SOURCE_REFERENCE)
                stats["links"] += 1

    return stats


# ─── Ingest samples.csv ───────────────────────────────────────────────────

def ingest_samples_csv(cur):
    print(f"\n  Fetching samples.csv ...")
    raw = fetch_url("samples.csv")

    reader = csv.DictReader(io.StringIO(raw))
    stats  = {"iocs": 0, "skipped": 0}
    today  = date.today()

    for row in reader:
        sha256   = row.get("sha256", "").strip()
        app_name = row.get("app_name", "").strip()

        if not sha256 or not app_name:
            stats["skipped"] += 1
            continue

        cur.execute("SELECT app_id FROM stalkerware_apps WHERE app_name = ?", (app_name,))
        app_row = cur.fetchone()
        if not app_row:
            stats["skipped"] += 1
            continue

        app_id = app_row["app_id"]
        ioc_id = get_or_insert_ioc(cur, "file_hash", sha256, "High", today)
        link_app_ioc(cur, app_id, ioc_id, "drops", SOURCE_REFERENCE)
        stats["iocs"] += 1

    return stats


# ─── Main ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Stalkerware IoC Scraper — SQLite (ECHAP source)")
    print("=" * 60)

    print(f"\n[0] Opening database at {DB_PATH} ...")
    conn = get_connection()
    cur = conn.cursor()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        cur.executescript(f.read())
    print(f"    Schema applied from {os.path.basename(SCHEMA_PATH)}.")

    try:
        print("\n[1/3] Ingesting stalkerware — ioc.yaml ...")
        stats_ioc = ingest_yaml(cur, "ioc.yaml", default_platform="Android")
        print(f"      Apps: {stats_ioc['apps']} | IoCs: {stats_ioc['iocs']} | Links: {stats_ioc['links']}")

        print("\n[2/3] Ingesting watchware — watchware.yaml ...")
        stats_watch = ingest_yaml(cur, "watchware.yaml", default_platform="Android")
        print(f"      Apps: {stats_watch['apps']} | IoCs: {stats_watch['iocs']} | Links: {stats_watch['links']}")

        print("\n[3/3] Ingesting file hashes — samples.csv ...")
        stats_samples = ingest_samples_csv(cur)
        print(f"      Hashes inserted: {stats_samples['iocs']} | Skipped: {stats_samples['skipped']}")

        conn.commit()

        total_apps  = stats_ioc["apps"] + stats_watch["apps"]
        total_iocs  = stats_ioc["iocs"] + stats_watch["iocs"] + stats_samples["iocs"]
        total_links = stats_ioc["links"] + stats_watch["links"] + stats_samples["iocs"]

        print("\n" + "=" * 60)
        print("  Scrape Complete!")
        print(f"  Total apps inserted : {total_apps}")
        print(f"  Total IoCs inserted : {total_iocs}")
        print(f"  Total links created : {total_links}")
        print(f"  Database written to : {DB_PATH}")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
