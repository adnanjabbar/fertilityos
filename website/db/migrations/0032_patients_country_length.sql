-- Allow full country names in patients (e.g. "Pakistan", "United States") instead of 2-letter ISO only.
ALTER TABLE "patients" ALTER COLUMN "country" TYPE varchar(128);
