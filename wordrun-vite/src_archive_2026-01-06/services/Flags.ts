import { supabase } from '../supabase'

export async function featureFlag(key: string, defaultValue: boolean): Promise<boolean> {
  try {
    const { data } = await supabase.from('feature_flags').select('flag_key, default').eq('flag_key', key).limit(1)
    if (data && data.length) return !!data[0].default
  } catch {}
  return defaultValue
}