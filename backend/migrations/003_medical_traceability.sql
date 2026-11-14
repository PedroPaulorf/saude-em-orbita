-- Additive research registry and per-account snapshots. Existing domain tables stay intact.
CREATE TABLE medical_references (id text PRIMARY KEY, document jsonb NOT NULL);
CREATE TABLE medical_rules (version text PRIMARY KEY, document jsonb NOT NULL);
CREATE TABLE medical_observations (
  checkin_id uuid NOT NULL,
  crew_id text NOT NULL REFERENCES crew(id),
  metric text NOT NULL,
  rule_version text NOT NULL REFERENCES medical_rules(version),
  document jsonb NOT NULL,
  PRIMARY KEY(checkin_id, metric),
  FOREIGN KEY(checkin_id, crew_id) REFERENCES checkins(id, crew_id)
);
CREATE INDEX medical_observations_crew ON medical_observations(crew_id, checkin_id);
CREATE TABLE mission_simulations (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  input jsonb NOT NULL,
  result jsonb NOT NULL
);
CREATE INDEX mission_simulations_crew ON mission_simulations(crew_id, created_at DESC, id DESC);
