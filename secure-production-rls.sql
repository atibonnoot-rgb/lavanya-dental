-- ═══════════════════════════════════════════════════════════════════
-- LAVANYA DENTAL CLINIC - Hardened Production Database Security (RLS)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dlylhcrcxdjbfvprbuqb/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable Row Level Security (RLS) on ALL tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patient_records') THEN
    ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'in_clinic_queue') THEN
    ALTER TABLE in_clinic_queue ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Clean up any existing insecure policies
DROP POLICY IF EXISTS "Allow public read on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow public insert on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow public update on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow public delete on doctors" ON doctors;
DROP POLICY IF EXISTS "Staff manage doctors" ON doctors;

DROP POLICY IF EXISTS "Allow public read on services" ON services;
DROP POLICY IF EXISTS "Allow public insert on services" ON services;
DROP POLICY IF EXISTS "Allow public update on services" ON services;
DROP POLICY IF EXISTS "Allow public delete on services" ON services;
DROP POLICY IF EXISTS "Staff manage services" ON services;

DROP POLICY IF EXISTS "Allow public read on clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "Allow public update on clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "Staff manage clinic_settings" ON clinic_settings;

DROP POLICY IF EXISTS "Allow public read on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public update on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public delete on appointments" ON appointments;
DROP POLICY IF EXISTS "Staff manage appointments" ON appointments;

DROP POLICY IF EXISTS "Allow public insert on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow public read on audit_logs" ON audit_logs;

-- 3. DOCTORS TABLE: Public read-only; mutations restricted to authenticated staff
CREATE POLICY "Public can view doctors" ON doctors 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated staff can manage doctors" ON doctors 
  FOR ALL USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- 4. SERVICES TABLE: Public read-only; mutations restricted to authenticated staff
CREATE POLICY "Public can view services" ON services 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated staff can manage services" ON services 
  FOR ALL USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- 5. CLINIC_SETTINGS TABLE: Public read-only; mutations restricted to authenticated staff
CREATE POLICY "Public can view clinic settings" ON clinic_settings 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated staff can update clinic settings" ON clinic_settings 
  FOR UPDATE USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- 6. APPOINTMENTS TABLE:
-- Public can book new appointments (INSERT only)
CREATE POLICY "Public can submit booking" ON appointments 
  FOR INSERT WITH CHECK (true);

-- Public can read appointments (for live status & lookups)
CREATE POLICY "Public read appointments" ON appointments 
  FOR SELECT USING (true);

-- Mutations (UPDATE & DELETE) strictly restricted to authenticated staff
CREATE POLICY "Authenticated staff can update appointments" ON appointments 
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated staff can delete appointments" ON appointments 
  FOR DELETE USING (auth.role() = 'authenticated');

-- 7. AUDIT LOGS TABLE: Public can insert logs; only authenticated staff can view/delete
CREATE POLICY "Allow system insert audit logs" ON audit_logs 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated staff view audit logs" ON audit_logs 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 8. PATIENT RECORDS & IN-CLINIC QUEUE (Staff only)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patient_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Staff manage patient records" ON patient_records';
    EXECUTE 'CREATE POLICY "Staff manage patient records" ON patient_records FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'in_clinic_queue') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Staff manage in clinic queue" ON in_clinic_queue';
    EXECUTE 'CREATE POLICY "Staff manage in clinic queue" ON in_clinic_queue FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- 9. Confirmation audit
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('doctors', 'services', 'clinic_settings', 'audit_logs', 'appointments', 'patient_records', 'in_clinic_queue')
ORDER BY tablename, cmd;
