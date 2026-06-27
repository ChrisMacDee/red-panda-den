-- Red Panda Den — PostgreSQL initialisation
-- Runs once when the postgres container is first created.
-- Database: life_platform (created by POSTGRES_DB env var)

-- ─── Schemas ──────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS jobs;
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE SCHEMA IF NOT EXISTS medication;
CREATE SCHEMA IF NOT EXISTS dashboard;

-- ─── Jobs ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jobs.applications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company     TEXT NOT NULL,
    role        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'interested'
                    CHECK (status IN ('interested','applied','screening','interviewing','offer','rejected','withdrawn','accepted')),
    url         TEXT,
    salary_min  INTEGER,
    salary_max  INTEGER,
    location    TEXT,
    remote      BOOLEAN NOT NULL DEFAULT false,
    contact_name  TEXT,
    contact_email TEXT,
    notes       TEXT,
    applied_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs.events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES jobs.applications(id) ON DELETE CASCADE,
    event_type     TEXT NOT NULL
                       CHECK (event_type IN ('applied','email_sent','phone_screen','interview','offer','rejection','follow_up','note')),
    description    TEXT,
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_applications_status_idx ON jobs.applications(status);
CREATE INDEX IF NOT EXISTS jobs_events_application_id_idx ON jobs.events(application_id);

-- ─── Knowledge ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge.topics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','completed','revisiting')),
    progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge.resources (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id     UUID NOT NULL REFERENCES knowledge.topics(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    url          TEXT,
    resource_type TEXT NOT NULL DEFAULT 'article'
                      CHECK (resource_type IN ('course','video','article','book','documentation','wiki','other')),
    notes        TEXT,
    completed    BOOLEAN NOT NULL DEFAULT false,
    file_path    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge.notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id   UUID NOT NULL REFERENCES knowledge.topics(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_topics_status_idx ON knowledge.topics(status);
CREATE INDEX IF NOT EXISTS knowledge_resources_topic_id_idx ON knowledge.resources(topic_id);
CREATE INDEX IF NOT EXISTS knowledge_notes_topic_id_idx ON knowledge.notes(topic_id);

-- ─── Medication ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medication.medications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    dosage      TEXT NOT NULL,
    frequency   TEXT NOT NULL,
    doses_per_day INTEGER NOT NULL DEFAULT 1,
    person      TEXT NOT NULL,
    prescriber  TEXT,
    pharmacy    TEXT,
    notes       TEXT,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication.stock (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id       UUID NOT NULL UNIQUE REFERENCES medication.medications(id) ON DELETE CASCADE,
    quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit                TEXT NOT NULL DEFAULT 'tablets',
    reorder_threshold   INTEGER NOT NULL DEFAULT 14,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication.log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medication.medications(id) ON DELETE CASCADE,
    action        TEXT NOT NULL
                      CHECK (action IN ('taken','restocked','disposed','adjusted')),
    quantity_delta INTEGER NOT NULL,
    notes         TEXT,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medication_log_medication_id_idx ON medication.log(medication_id);

-- ─── Dashboard ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dashboard.favourites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    icon_type   TEXT NOT NULL DEFAULT 'favicon'
                    CHECK (icon_type IN ('favicon','library','custom')),
    icon_value  TEXT,
    colour      TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Additional databases ─────────────────────────────────────────────────────
-- These services manage their own tables; we just need the databases to exist.

\c postgres
CREATE DATABASE medusa;
CREATE DATABASE wikijs;
