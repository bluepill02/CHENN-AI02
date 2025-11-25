import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iexcbrjruvdowdjszexx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JCwrJSXilN09eWlX8URoZQ_pY7PQlja.';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables, using fallbacks');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
