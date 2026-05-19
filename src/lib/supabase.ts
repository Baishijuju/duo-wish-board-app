import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const supabaseClientKey = supabasePublishableKey || supabaseAnonKey || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseClientKey)

export const supabaseAuthMode = supabasePublishableKey
  ? 'publishable-key'
  : supabaseAnonKey
    ? 'anon-key'
    : 'not-configured'

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl ?? '', supabaseClientKey, {
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export const supabaseReadinessMessage = isSupabaseConfigured
  ? `环境变量已就绪，当前前端将使用 ${supabaseAuthMode} 连接 Supabase。`
  : '尚未配置 VITE_SUPABASE_URL 与 VITE_SUPABASE_PUBLISHABLE_KEY，当前使用本地 mock 数据。'