import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ykxbzvdmzymjirwyloaf.supabase.co'
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJ6dmRtenltamlyd3lsb2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTMzNzcsImV4cCI6MjA5MDE2OTM3N30.ddGoehwOLwh8lZ9tjiQqVPXPhhqequox0J5FPHCz9sI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)