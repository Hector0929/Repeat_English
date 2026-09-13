import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://mpocdwtjozygbvxshfbd.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ecg4nZ5cZOlinNFz3pe-DA_94uD2MgZ';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log('✅ Supabase 已成功連線至:', supabaseUrl);
  } else {
    console.warn(
      'Supabase 環境變數 (NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY) 尚未設定，將暫時使用 LocalStorage。'
    );
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
