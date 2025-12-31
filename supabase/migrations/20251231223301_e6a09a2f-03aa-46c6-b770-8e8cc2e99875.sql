-- Update schools to link to their districts using lea_id -> nces_id mapping
UPDATE schools s
SET district_id = d.id
FROM districts d
WHERE s.lea_id = d.nces_id
AND s.district_id IS NULL;