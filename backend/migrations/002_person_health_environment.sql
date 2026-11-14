-- Additive domain model. Authentication and the original authored check-ins remain intact.
CREATE TABLE person (
  id text PRIMARY KEY REFERENCES crew(id),
  name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),
  age integer CHECK(age BETWEEN 0 AND 130),
  weight_kg double precision CHECK(weight_kg > 0 AND weight_kg <= 1000),
  height_cm double precision CHECK(height_cm > 0 AND height_cm <= 300),
  sex text CHECK(sex IN ('female','male','intersex','unspecified')),
  medical_history text CHECK(length(medical_history) <= 4000),
  weight_measured_at timestamptz,
  weight_updated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((weight_kg IS NULL) = (weight_measured_at IS NULL))
);
INSERT INTO person(id,name) SELECT id,COALESCE(NULLIF(btrim(profile->>'displayName'),''),username) FROM crew;

CREATE FUNCTION initialize_person() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO person(id,name) VALUES(NEW.id,COALESCE(NULLIF(btrim(NEW.profile->>'displayName'),''),NEW.username));
  RETURN NEW;
END;
$$;
CREATE TRIGGER crew_person AFTER INSERT ON crew FOR EACH ROW EXECUTE FUNCTION initialize_person();

ALTER TABLE checkins ADD CONSTRAINT checkins_id_crew_unique UNIQUE(id,crew_id);
CREATE TABLE health (
  checkin_id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES person(id),
  client_id text NOT NULL,
  at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  source text NOT NULL CHECK(source='simulated'),
  heart_rate_bpm double precision CHECK(heart_rate_bpm > 0 AND heart_rate_bpm <= 1000),
  oxygen_saturation_percent double precision CHECK(oxygen_saturation_percent BETWEEN 0 AND 100),
  blood_pressure_systolic_mmhg double precision CHECK(blood_pressure_systolic_mmhg > 0 AND blood_pressure_systolic_mmhg <= 1000),
  blood_pressure_diastolic_mmhg double precision CHECK(blood_pressure_diastolic_mmhg > 0 AND blood_pressure_diastolic_mmhg <= 1000),
  body_temperature_c double precision CHECK(body_temperature_c > 0 AND body_temperature_c <= 1000),
  respiratory_rate_per_min double precision CHECK(respiratory_rate_per_min > 0 AND respiratory_rate_per_min <= 1000),
  sleep_hours double precision CHECK(sleep_hours BETWEEN 0 AND 24),
  urine text CHECK(length(urine) BETWEEN 1 AND 2000),
  stool text CHECK(length(stool) BETWEEN 1 AND 2000),
  FOREIGN KEY(checkin_id,crew_id) REFERENCES checkins(id,crew_id),
  UNIQUE(crew_id,client_id),
  CHECK((blood_pressure_systolic_mmhg IS NULL) = (blood_pressure_diastolic_mmhg IS NULL))
);
CREATE INDEX health_crew_time ON health(crew_id,at DESC,checkin_id DESC);

CREATE FUNCTION project_checkin_domains(record checkins) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v jsonb := record.payload->'vitals';
  details jsonb := record.payload->'healthDetails';
BEGIN
  IF v ?| ARRAY['heartRate','spo2','bloodPressure','temperature','respiratoryRate','sleep']
     OR details ?| ARRAY['urine','stool'] THEN
    INSERT INTO health(checkin_id,crew_id,client_id,at,received_at,source,heart_rate_bpm,oxygen_saturation_percent,
      blood_pressure_systolic_mmhg,blood_pressure_diastolic_mmhg,body_temperature_c,respiratory_rate_per_min,sleep_hours,urine,stool)
    VALUES(record.id,record.crew_id,record.client_id,record.at,record.received_at,record.payload->>'source',
      (v->>'heartRate')::double precision,(v->>'spo2')::double precision,
      (v->>'bloodPressure')::double precision,(v->>'bloodPressureDiastolic')::double precision,
      (v->>'temperature')::double precision,(v->>'respiratoryRate')::double precision,(v->>'sleep')::double precision,
      details->>'urine',details->>'stool') ON CONFLICT(checkin_id) DO NOTHING;
  END IF;
  -- An old offline record cannot replace a more recent weight entered in Person.
  IF v ? 'bodyMass' THEN
    UPDATE person SET weight_kg=(v->>'bodyMass')::double precision,weight_measured_at=record.at,weight_updated_at=record.at,updated_at=now()
      WHERE id=record.crew_id AND (weight_updated_at IS NULL OR weight_updated_at < record.at);
  END IF;
END;
$$;
SELECT project_checkin_domains(c) FROM checkins c ORDER BY c.at,c.received_at,c.id;
CREATE FUNCTION sync_checkin_domains() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM project_checkin_domains(NEW);
  RETURN NEW;
END;
$$;
CREATE TRIGGER checkin_domains AFTER INSERT ON checkins FOR EACH ROW EXECUTE FUNCTION sync_checkin_domains();

CREATE TABLE environment (
  id uuid PRIMARY KEY,
  crew_id text NOT NULL REFERENCES person(id),
  client_id text NOT NULL CHECK(length(client_id) BETWEEN 1 AND 128),
  at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK(source='simulated'),
  radiation_dose_msv double precision CHECK(radiation_dose_msv BETWEEN 0 AND 1000000),
  altitude_meters double precision CHECK(altitude_meters BETWEEN -500 AND 1000000000),
  temperature_c double precision CHECK(temperature_c BETWEEN -273.15 AND 1000),
  oxygen_percent double precision CHECK(oxygen_percent BETWEEN 0 AND 100),
  UNIQUE(crew_id,client_id),
  CHECK(num_nonnulls(radiation_dose_msv,altitude_meters,temperature_c,oxygen_percent)>0)
);
CREATE INDEX environment_crew_time ON environment(crew_id,at DESC,id DESC);
