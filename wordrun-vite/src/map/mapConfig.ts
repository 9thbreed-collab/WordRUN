// src/map/mapConfig.ts

// 🔹 High-level per-land config
export type LandConfig = {
  id: number;          // numeric land ID (your GameplayScene uses this.spec.land)
  key: string;         // stable string key
  name: string;        // display name
  mapBgUri: string;    // background image for the world map
  theme: {
    accent: string;
    textOnLight: string;
    textOnDark: string;
  };
};

// 🔹 A clickable node on the world map
export type MapNode = {
  id: string;              // unique node id (e.g. "land1_level3")
  landId: number;          // which land this belongs to
  levelId: string | null;  // "land_1_level_3" or null for non-level nodes
  kind: "level" | "camp" | "lore" | "shop" | "gate";
  xPct: number;            // 0–100 horizontal percentage on the map image
  yPct: number;            // 0–100 vertical percentage on the map image
};

// 🔹 Land 1 config ("Dawnway Valley")
export const LANDS: LandConfig[] = [
  {
    id: 1,
    key: "land1",
    name: "Dawnway Valley",
    // Change this to your actual Land 1 map asset path
    mapBgUri: "/assets/maps/map_land1_bg.svg",
    theme: {
      accent: "#ffd54f",
      textOnLight: "#111111",
      textOnDark: "#ffffff",
    },
  },

  // Later: Land 2, 3, etc.
  // {
  //   id: 2,
  //   key: "land2",
  //   name: "_____",
  //   mapBgUri: "/assets/maps/map_land2_bg.svg",
  //   theme: { ... },
  // },
];

// Helper: consistent levelId builder, matching GameplayScene
function levelIdFrom(land: number, level: number): string {
  // This matches how GameplayScene builds IDs:
  //  `land_${this.spec.land}_level_${this.spec.level}`
  return `land_${land}_level_${level}`;
}

// 🔹 Land 1 has 25 levels laid out along an S-shaped path
export const MAP_NODES: MapNode[] = [
  // Entry / camp node near bottom (non-playable)
  {
    id: "land1_entry",
    landId: 1,
    levelId: null,
    kind: "camp",
    xPct: 50,
    yPct: 92,
  },

  // ===== Segment A – Lower valley (Levels 1–5) =====
  {
    id: "land1_level1",
    landId: 1,
    levelId: levelIdFrom(1, 1),
    kind: "level",
    xPct: 48,
    yPct: 84,
  },
  {
    id: "land1_level2",
    landId: 1,
    levelId: levelIdFrom(1, 2),
    kind: "level",
    xPct: 54,
    yPct: 80,
  },
  {
    id: "land1_level3",
    landId: 1,
    levelId: levelIdFrom(1, 3),
    kind: "level",
    xPct: 60,
    yPct: 76,
  },
  {
    id: "land1_level4",
    landId: 1,
    levelId: levelIdFrom(1, 4),
    kind: "level",
    xPct: 55,
    yPct: 72,
  },
  {
    id: "land1_level5",
    landId: 1,
    levelId: levelIdFrom(1, 5),
    kind: "level",
    xPct: 49,
    yPct: 68,
  },

  // ===== Segment B – Approaching the landmark tree/arch (Levels 6–10) =====
  {
    id: "land1_level6",
    landId: 1,
    levelId: levelIdFrom(1, 6),
    kind: "level",
    xPct: 45,
    yPct: 64,
  },
  {
    id: "land1_level7",
    landId: 1,
    levelId: levelIdFrom(1, 7),
    kind: "level",
    xPct: 50,
    yPct: 60,
  },
  {
    id: "land1_level8",
    landId: 1,
    levelId: levelIdFrom(1, 8),
    kind: "level",
    xPct: 56,
    yPct: 56,
  },
  {
    id: "land1_level9",
    landId: 1,
    levelId: levelIdFrom(1, 9),
    kind: "level",
    xPct: 62,
    yPct: 52,
  },
  {
    id: "land1_level10",
    landId: 1,
    levelId: levelIdFrom(1, 10),
    kind: "level",
    xPct: 57,
    yPct: 48,
  },

  // ===== Segment C – Around the central landmark (Levels 11–15) =====
  {
    id: "land1_level11",
    landId: 1,
    levelId: levelIdFrom(1, 11),
    kind: "level",
    xPct: 51,
    yPct: 44,
  },
  {
    id: "land1_level12",
    landId: 1,
    levelId: levelIdFrom(1, 12),
    kind: "level",
    xPct: 45,
    yPct: 40,
  },
  {
    id: "land1_level13",
    landId: 1,
    levelId: levelIdFrom(1, 13),
    kind: "level",
    xPct: 40,
    yPct: 36,
  },
  {
    id: "land1_level14",
    landId: 1,
    levelId: levelIdFrom(1, 14),
    kind: "level",
    xPct: 47,
    yPct: 32,
  },
  {
    id: "land1_level15",
    landId: 1,
    levelId: levelIdFrom(1, 15),
    kind: "level",
    xPct: 54,
    yPct: 30,
  },

  // ===== Segment D – Village zone (Levels 16–20) =====
  {
    id: "land1_level16",
    landId: 1,
    levelId: levelIdFrom(1, 16),
    kind: "level",
    xPct: 60,
    yPct: 36,
  },
  {
    id: "land1_level17",
    landId: 1,
    levelId: levelIdFrom(1, 17),
    kind: "level",
    xPct: 66,
    yPct: 40,
  },
  {
    id: "land1_level18",
    landId: 1,
    levelId: levelIdFrom(1, 18),
    kind: "level",
    xPct: 70,
    yPct: 34,
  },
  {
    id: "land1_level19",
    landId: 1,
    levelId: levelIdFrom(1, 19),
    kind: "level",
    xPct: 64,
    yPct: 28,
  },
  {
    id: "land1_level20",
    landId: 1,
    levelId: levelIdFrom(1, 20),
    kind: "level",
    xPct: 58,
    yPct: 24,
  },

  // ===== Segment E – Cliff / exit zone (Levels 21–25) =====
  {
    id: "land1_level21",
    landId: 1,
    levelId: levelIdFrom(1, 21),
    kind: "level",
    xPct: 52,
    yPct: 20,
  },
  {
    id: "land1_level22",
    landId: 1,
    levelId: levelIdFrom(1, 22),
    kind: "level",
    xPct: 46,
    yPct: 18,
  },
  {
    id: "land1_level23",
    landId: 1,
    levelId: levelIdFrom(1, 23),
    kind: "level",
    xPct: 40,
    yPct: 16,
  },
  {
    id: "land1_level24",
    landId: 1,
    levelId: levelIdFrom(1, 24),
    kind: "level",
    xPct: 47,
    yPct: 12,
  },
  {
    id: "land1_level25",
    landId: 1,
    levelId: levelIdFrom(1, 25),
    kind: "level",
    xPct: 54,
    yPct: 10,
  },
];
