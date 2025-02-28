import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jzhjnfftbcovutkwxsqr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aGpuZmZ0YmNvdnV0a3d4c3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMDE5MjAsImV4cCI6MjA1MzY3NzkyMH0.Lr_l-7MgRC8qOgm2lwn1HAtb3Xih3WxO8vgd8UJlg0c'

export const supabase = createClient(supabaseUrl, supabaseKey)

