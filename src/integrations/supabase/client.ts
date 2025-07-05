import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://nstjqrakcglxtrojjrgd.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdGpxcmFrY2dseHRyb2pqcmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODc5NzAsImV4cCI6MjA2NzI2Mzk3MH0.jrMfv5XfJv4_jwYiZCR7PVmjDXN_et9npmzsa3kPwT8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)