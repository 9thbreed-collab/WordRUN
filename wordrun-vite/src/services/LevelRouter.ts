export type LevelRef = { land: number; level: number }

/** Convert your level_id strings like "land_1_level_2" to { land:1, level:2 } */
export function parseLevelId(levelId: string): LevelRef | null {
  const m = levelId.match(/land_(\d+)_level_(\d+)/i)
  if (!m) return null
  return { land: Number(m[1]), level: Number(m[2]) }
}

/** Start GameplayScene with the given LevelRef. */
export function goToGameplay(scene: Phaser.Scene, ref: LevelRef) {
  scene.scene.start('GameplayScene', { land: ref.land, level: ref.level })
}