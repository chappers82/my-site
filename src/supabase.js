import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ykxbzdmzymjirwyloaf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJ6dmRtenltamlyd3lsb2FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU5MzM3NywiZXhwIjoyMDkwMTY5Mzc3fQ.dtgCpdbFo017pMsKgZHoIPMEMkrhMoLvEjEBdsGVALE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)