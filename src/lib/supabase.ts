import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface VoteOption {
  id: string;
  text_pt: string;
  text_es: string;
  text_en: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  vote_option_id: string;
  created_at: string;
  ip_address?: string;
}
