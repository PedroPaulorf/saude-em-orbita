-- Generic HRS devices are not assumed to be made by any particular manufacturer.
ALTER TABLE wearable_imports DROP CONSTRAINT wearable_imports_source_check;
ALTER TABLE wearable_imports ADD CONSTRAINT wearable_imports_source_check
  CHECK (source IN ('apple','samsung','garmin','actlumus','bluetooth'));
