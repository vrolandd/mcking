import { createClient } from '@supabase/supabase-js'
import type { Database } from 'database.types'

export function createFrontClient({
  supabaseUrl,
  supabaseKey,
}: {
  supabaseUrl: string;
  supabaseKey: string;
}) {
  return createClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}