-- NEXUS-Med import (synthetic crew NX-01..NX-06): elimination counts and RR-1 cabin context.
-- Additive only. The original mSv column stays for the records that already use it.
ALTER TABLE health
  ADD COLUMN urinations_24h integer CHECK(urinations_24h BETWEEN 0 AND 100),
  ADD COLUMN stools_24h integer CHECK(stools_24h BETWEEN 0 AND 100);

ALTER TABLE environment
  ADD COLUMN radiation_dose_mgy_day double precision CHECK(radiation_dose_mgy_day BETWEEN 0 AND 1000000),
  ADD COLUMN radiation_accum_mgy double precision CHECK(radiation_accum_mgy BETWEEN 0 AND 1000000),
  ADD COLUMN co2_ppm double precision CHECK(co2_ppm BETWEEN 0 AND 1000000),
  ADD COLUMN relative_humidity_pct double precision CHECK(relative_humidity_pct BETWEEN 0 AND 100);
-- A record still needs at least one value, now counting the new columns.
ALTER TABLE environment DROP CONSTRAINT environment_check;
ALTER TABLE environment ADD CONSTRAINT environment_any_value CHECK(num_nonnulls(radiation_dose_msv,altitude_meters,temperature_c,
  oxygen_percent,radiation_dose_mgy_day,radiation_accum_mgy,co2_ppm,relative_humidity_pct)>0);

-- Same projection as 002, plus the daily counts from healthDetails (urinations24h, stools24h).
CREATE OR REPLACE FUNCTION project_checkin_domains(record checkins) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v jsonb := record.payload->'vitals';
  details jsonb := record.payload->'healthDetails';
BEGIN
  IF v ?| ARRAY['heartRate','spo2','bloodPressure','temperature','respiratoryRate','sleep']
     OR details ?| ARRAY['urine','stool','urinations24h','stools24h'] THEN
    INSERT INTO health(checkin_id,crew_id,client_id,at,received_at,source,heart_rate_bpm,oxygen_saturation_percent,
      blood_pressure_systolic_mmhg,blood_pressure_diastolic_mmhg,body_temperature_c,respiratory_rate_per_min,sleep_hours,urine,stool,
      urinations_24h,stools_24h)
    VALUES(record.id,record.crew_id,record.client_id,record.at,record.received_at,record.payload->>'source',
      (v->>'heartRate')::double precision,(v->>'spo2')::double precision,
      (v->>'bloodPressure')::double precision,(v->>'bloodPressureDiastolic')::double precision,
      (v->>'temperature')::double precision,(v->>'respiratoryRate')::double precision,(v->>'sleep')::double precision,
      details->>'urine',details->>'stool',(details->>'urinations24h')::integer,(details->>'stools24h')::integer)
      ON CONFLICT(checkin_id) DO NOTHING;
  END IF;
  -- An old offline record cannot replace a more recent weight entered in Person.
  IF v ? 'bodyMass' THEN
    UPDATE person SET weight_kg=(v->>'bodyMass')::double precision,weight_measured_at=record.at,weight_updated_at=record.at,updated_at=now()
      WHERE id=record.crew_id AND (weight_updated_at IS NULL OR weight_updated_at < record.at);
  END IF;
END;
$$;
