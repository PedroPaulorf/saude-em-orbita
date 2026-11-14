CREATE TABLE crew (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  profile jsonb NOT NULL
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE checkins (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id),
  client_id text NOT NULL,
  at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  UNIQUE(crew_id, client_id)
);
CREATE INDEX checkins_crew_time ON checkins(crew_id, at DESC);
CREATE TABLE symptoms (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id),
  client_id text NOT NULL,
  at timestamptz NOT NULL,
  onset_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  UNIQUE(crew_id, client_id),
  UNIQUE(id, crew_id)
);
CREATE INDEX symptoms_crew_time ON symptoms(crew_id, at DESC);
CREATE TABLE symptom_events (
  id uuid PRIMARY KEY,
  symptom_id uuid NOT NULL,
  crew_id text NOT NULL REFERENCES crew(id),
  client_id text NOT NULL,
  at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL CHECK(type IN ('start', 'evolution', 'resolution')),
  payload jsonb NOT NULL,
  FOREIGN KEY (symptom_id, crew_id) REFERENCES symptoms(id, crew_id),
  UNIQUE(crew_id, client_id)
);
CREATE INDEX symptom_events_crew_time ON symptom_events(crew_id, symptom_id, at, received_at);
CREATE FUNCTION reject_symptom_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Symptom events are append-only';
END;
$$;
CREATE TRIGGER symptom_events_append_only BEFORE UPDATE OR DELETE ON symptom_events
FOR EACH ROW EXECUTE FUNCTION reject_symptom_event_mutation();
CREATE TABLE analyses (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  window_from timestamptz NOT NULL,
  window_to timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE INDEX analyses_crew_time ON analyses(crew_id, created_at DESC);
