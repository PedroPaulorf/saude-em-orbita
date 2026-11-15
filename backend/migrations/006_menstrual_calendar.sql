-- Personal, self-reported records. Research profiles never populate this table.
CREATE TABLE menstrual_periods (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  flow text NOT NULL CHECK (flow IN ('unspecified','spotting','light','moderate','heavy')),
  pain smallint CHECK (pain BETWEEN 0 AND 10),
  symptoms text[] NOT NULL DEFAULT '{}',
  note text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (crew_id,client_id),
  CHECK (start_date >= DATE '1900-01-01'),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX menstrual_periods_owner_date ON menstrual_periods(crew_id,start_date DESC);
