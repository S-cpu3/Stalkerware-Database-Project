-- Stalkerware IoC database schema (SQLite).
-- Mirrors ../stalkerware_database.sql, translated from MySQL to SQLite.
-- Loaded by scraper.py at startup.

CREATE TABLE IF NOT EXISTS stalkerware_apps (
    app_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name     TEXT,
    platform     TEXT,
    release_date TEXT
);

CREATE TABLE IF NOT EXISTS iocs (
    ioc_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ioc_type        TEXT,
    ioc_value       TEXT,
    severity_level  TEXT,
    date_identified TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_name TEXT,
    risk_level      TEXT
);

CREATE TABLE IF NOT EXISTS app_ioc (
    app_ioc_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    relationship_type TEXT,
    source_reference  TEXT,
    app_id            INTEGER REFERENCES stalkerware_apps(app_id),
    ioc_id            INTEGER REFERENCES iocs(ioc_id)
);

CREATE TABLE IF NOT EXISTS app_permissions (
    app_permission_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    required_or_optional TEXT,
    abuse_purpose        TEXT,
    app_id               INTEGER REFERENCES stalkerware_apps(app_id),
    permission_id        INTEGER REFERENCES permissions(permission_id)
);

CREATE INDEX        IF NOT EXISTS ix_iocs_value     ON iocs(ioc_value);
CREATE INDEX        IF NOT EXISTS ix_iocs_type      ON iocs(ioc_type);
CREATE INDEX        IF NOT EXISTS ix_app_ioc_app   ON app_ioc(app_id);
CREATE INDEX        IF NOT EXISTS ix_app_ioc_ioc   ON app_ioc(ioc_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_apps_name      ON stalkerware_apps(app_name);
CREATE UNIQUE INDEX IF NOT EXISTS ux_iocs_type_val  ON iocs(ioc_type, ioc_value);
CREATE UNIQUE INDEX IF NOT EXISTS ux_app_ioc_pair   ON app_ioc(app_id, ioc_id);
