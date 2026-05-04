// ══════════════════════════════════════════════
//  SUPABASE CLIENT — shared across all pages
//  DO NOT expose your secret key here, only the publishable key
// ══════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL  = 'https://xbazuosvlggtolahgcjv.supabase.co'
const SUPABASE_KEY  = 'sb_publishable_9Wy4npRqw4-b5XbldMQACg_RF2uXc-F'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)