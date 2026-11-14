-- Imported observations stay separate from demonstration check-ups and rules.
CREATE TABLE wearable_imports (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  digest text NOT NULL,
  source text NOT NULL CHECK (source IN ('apple','samsung','garmin','actlumus')),
  format text NOT NULL,
  quality text NOT NULL CHECK (quality IN ('unverified','example')),
  sample_count integer NOT NULL,
  added integer NOT NULL,
  duplicates integer NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (crew_id, client_id),
  UNIQUE (id, crew_id)
);
CREATE TABLE wearable_samples (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
  import_id uuid NOT NULL,
  sample_key text NOT NULL,
  at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (import_id, crew_id) REFERENCES wearable_imports(id, crew_id) ON DELETE CASCADE,
  UNIQUE (crew_id, sample_key)
);
CREATE INDEX wearable_samples_history ON wearable_samples(crew_id, at DESC, id DESC);
