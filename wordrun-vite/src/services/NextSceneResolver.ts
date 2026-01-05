import { supabase } from '../supabase'

export async function resolveNextLevelId(currentLevelId: string, hinted?: string): Promise<string | null> {
  // Prefer hinted if it's not looping to self
  if (hinted && hinted !== currentLevelId) return hinted
  try {
    const { data, error } = await supabase
      .from('levels')
      .select('next_level_id_on_win')
      .eq('level_id', currentLevelId)
      .limit(1)
    if (error) return hinted ?? null
    return data && data[0]?.next_level_id_on_win || hinted || null
  } catch {
    return hinted ?? null
  }
}