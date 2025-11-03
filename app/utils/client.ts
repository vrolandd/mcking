import { createBrowserClient } from '@supabase/ssr'
import type { Database } from 'database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )
}