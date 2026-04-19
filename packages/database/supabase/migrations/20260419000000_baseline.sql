-- Baseline migration for WindTribe.
--
-- This file intentionally creates no objects. It establishes a timestamp
-- anchor so subsequent migrations (auth, bookings, centres, hotels, etc.)
-- apply in the expected order and the migrations table is never empty.
--
-- Real schema lands in follow-up migrations under Epic 2 (Data model).

SELECT 1;
