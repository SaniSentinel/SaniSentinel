-- ============================================================================
-- Seed every Northern Region district used by the app (UUID ids for officers).
-- Safe to re-run: merges legacy names, inserts gaps, syncs coords/region.
-- Matches UserManagement fallback names so dropdowns resolve to real IDs.
-- ============================================================================

-- Older seed used "Gushiegu"; app uses "Gushegu". Rename when only the legacy row exists.
UPDATE public.districts d
SET name = 'Gushegu', updated_at = NOW()
WHERE d.name = 'Gushiegu'
  AND NOT EXISTS (SELECT 1 FROM public.districts x WHERE x.name = 'Gushegu');

-- Older seed used "Tatale"; app uses "Tatale-Sanguli".
UPDATE public.districts d
SET
  name = 'Tatale-Sanguli',
  lat = 9.4167,
  lng = 0.2833,
  updated_at = NOW()
WHERE d.name = 'Tatale'
  AND NOT EXISTS (SELECT 1 FROM public.districts x WHERE x.name = 'Tatale-Sanguli');

WITH northern(name, region, lat, lng) AS (
  VALUES
    ('Chereponi', 'Northern', 10.0500::DECIMAL(10, 8), 0.0500::DECIMAL(11, 8)),
    ('Gushegu', 'Northern', 10.0667::DECIMAL(10, 8), -0.3500::DECIMAL(11, 8)),
    ('Karaga', 'Northern', 10.3000::DECIMAL(10, 8), -0.6000::DECIMAL(11, 8)),
    ('Kpandai', 'Northern', 8.4667::DECIMAL(10, 8), -0.0167::DECIMAL(11, 8)),
    ('Kumbungu', 'Northern', 9.5833::DECIMAL(10, 8), -0.8500::DECIMAL(11, 8)),
    ('Mamprugu-Moagduri', 'Northern', 10.5000::DECIMAL(10, 8), -0.7500::DECIMAL(11, 8)),
    ('Mion', 'Northern', 9.5667::DECIMAL(10, 8), -0.2000::DECIMAL(11, 8)),
    ('Nanton', 'Northern', 9.4000::DECIMAL(10, 8), -1.0833::DECIMAL(11, 8)),
    ('Saboba', 'Northern', 9.6167::DECIMAL(10, 8), 0.3833::DECIMAL(11, 8)),
    ('Sagnarigu', 'Northern', 9.4500::DECIMAL(10, 8), -0.8000::DECIMAL(11, 8)),
    ('Salaga', 'Northern', 8.5500::DECIMAL(10, 8), -0.5167::DECIMAL(11, 8)),
    ('Savelugu', 'Northern', 9.6333::DECIMAL(10, 8), -0.8333::DECIMAL(11, 8)),
    ('Tamale', 'Northern', 9.4034::DECIMAL(10, 8), -0.8424::DECIMAL(11, 8)),
    ('Tatale-Sanguli', 'Northern', 9.4167::DECIMAL(10, 8), 0.2833::DECIMAL(11, 8)),
    ('Tolon', 'Northern', 9.4167::DECIMAL(10, 8), -1.0000::DECIMAL(11, 8)),
    ('Wulensi', 'Northern', 8.9167::DECIMAL(10, 8), -0.1833::DECIMAL(11, 8)),
    ('Yendi', 'Northern', 9.4333::DECIMAL(10, 8), -0.0167::DECIMAL(11, 8)),
    ('Zabzugu', 'Northern', 9.8333::DECIMAL(10, 8), -0.1667::DECIMAL(11, 8))
)
INSERT INTO public.districts (name, region, lat, lng)
SELECT n.name, n.region, n.lat, n.lng
FROM northern n
WHERE NOT EXISTS (
  SELECT 1 FROM public.districts d WHERE d.name = n.name
);

UPDATE public.districts AS d
SET
  region = n.region,
  lat = n.lat,
  lng = n.lng,
  updated_at = NOW()
FROM (
  VALUES
    ('Chereponi', 'Northern', 10.0500::DECIMAL(10, 8), 0.0500::DECIMAL(11, 8)),
    ('Gushegu', 'Northern', 10.0667::DECIMAL(10, 8), -0.3500::DECIMAL(11, 8)),
    ('Karaga', 'Northern', 10.3000::DECIMAL(10, 8), -0.6000::DECIMAL(11, 8)),
    ('Kpandai', 'Northern', 8.4667::DECIMAL(10, 8), -0.0167::DECIMAL(11, 8)),
    ('Kumbungu', 'Northern', 9.5833::DECIMAL(10, 8), -0.8500::DECIMAL(11, 8)),
    ('Mamprugu-Moagduri', 'Northern', 10.5000::DECIMAL(10, 8), -0.7500::DECIMAL(11, 8)),
    ('Mion', 'Northern', 9.5667::DECIMAL(10, 8), -0.2000::DECIMAL(11, 8)),
    ('Nanton', 'Northern', 9.4000::DECIMAL(10, 8), -1.0833::DECIMAL(11, 8)),
    ('Saboba', 'Northern', 9.6167::DECIMAL(10, 8), 0.3833::DECIMAL(11, 8)),
    ('Sagnarigu', 'Northern', 9.4500::DECIMAL(10, 8), -0.8000::DECIMAL(11, 8)),
    ('Salaga', 'Northern', 8.5500::DECIMAL(10, 8), -0.5167::DECIMAL(11, 8)),
    ('Savelugu', 'Northern', 9.6333::DECIMAL(10, 8), -0.8333::DECIMAL(11, 8)),
    ('Tamale', 'Northern', 9.4034::DECIMAL(10, 8), -0.8424::DECIMAL(11, 8)),
    ('Tatale-Sanguli', 'Northern', 9.4167::DECIMAL(10, 8), 0.2833::DECIMAL(11, 8)),
    ('Tolon', 'Northern', 9.4167::DECIMAL(10, 8), -1.0000::DECIMAL(11, 8)),
    ('Wulensi', 'Northern', 8.9167::DECIMAL(10, 8), -0.1833::DECIMAL(11, 8)),
    ('Yendi', 'Northern', 9.4333::DECIMAL(10, 8), -0.0167::DECIMAL(11, 8)),
    ('Zabzugu', 'Northern', 9.8333::DECIMAL(10, 8), -0.1667::DECIMAL(11, 8))
) AS n(name, region, lat, lng)
WHERE d.name = n.name;
