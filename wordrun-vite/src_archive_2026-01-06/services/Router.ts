import Phaser from 'phaser'
import { supabase } from '../supabase'

async function resolveNextLevel(currentLevelId: string, hintedNextId?: string): Promise<string | null> {
  // Prefer explicit hint if it's not looping to self; otherwise look up in Supabase
  if (hintedNextId && hintedNextId !== currentLevelId) return hintedNextId
  try {
    const { data } = await supabase
      .from('levels')
      .select('next_level_id_on_win')
      .eq('level_id', currentLevelId)
      .limit(1)
    const nextId = data && data[0]?.next_level_id_on_win
    return nextId ?? null
  } catch {
    return hintedNextId ?? null
  }
}

export async function goToNextLevel(scene: Phaser.Scene, currentLevelId: string, hintedNextId?: string) {
  const nextId = await resolveNextLevel(currentLevelId, hintedNextId)
  if (!nextId || nextId === currentLevelId) {
    // safety: if misconfigured, just restart current
    scene.scene.start(currentLevelId)
    return
  }
  scene.scene.start('MapTransition', { currentLevelId, nextLevelId: nextId })
}