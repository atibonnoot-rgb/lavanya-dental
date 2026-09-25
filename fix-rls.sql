-- ═══════════════════════════════════════════════════════════════════
-- LAVANYA DENTAL - Supabase RLS Fix
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dlylhcrcxdjbfvprbuqb/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- DOCTORS TABLE: Allow public read + write (admin-controlled app)
DROP POLICY IF EXISTS "Allow public read on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow public insert on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow public update on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow public delete on doctors" ON doctors;

CREATE POLICY "Allow public read on doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow public insert on doctors" ON doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on doctors" ON doctors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on doctors" ON doctors FOR DELETE USING (true);

-- SERVICES TABLE: Allow public read + write (admin-controlled app)
DROP POLICY IF EXISTS "Allow public read on services" ON services;
DROP POLICY IF EXISTS "Allow public insert on services" ON services;
DROP POLICY IF EXISTS "Allow public update on services" ON services;
DROP POLICY IF EXISTS "Allow public delete on services" ON services;

CREATE POLICY "Allow public read on services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public insert on services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on services" ON services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on services" ON services FOR DELETE USING (true);

-- CLINIC_SETTINGS TABLE: Allow public read + write
DROP POLICY IF EXISTS "Allow public read on clinic_settings" ON clinic_settings;
DROP POLICY IF EXISTS "Allow public update on clinic_settings" ON clinic_settings;

CREATE POLICY "Allow public read on clinic_settings" ON clinic_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update on clinic_settings" ON clinic_settings FOR UPDATE USING (true) WITH CHECK (true);

-- AUDIT_LOGS TABLE: Allow public insert
DROP POLICY IF EXISTS "Allow public insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow public insert on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on audit_logs" ON audit_logs FOR SELECT USING (true);

-- APPOINTMENTS TABLE: Allow public read + insert + update + delete
DROP POLICY IF EXISTS "Allow public read on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public update on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public delete on appointments" ON appointments;

CREATE POLICY "Allow public read on appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on appointments" ON appointments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on appointments" ON appointments FOR DELETE USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('doctors', 'services', 'clinic_settings', 'audit_logs', 'appointments')
ORDER BY tablename, cmd;
