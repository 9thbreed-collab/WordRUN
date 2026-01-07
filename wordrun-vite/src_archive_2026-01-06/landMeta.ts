// src/landMeta.ts
// Central place to describe each land's "feel" and visuals.

export type LandMeta = {
  id: number;           // 0 = tutorial, 1,2,3 = main lands
  code: string;         // internal name: "tutorial", "dawn_trail", etc.
  name: string;         // player-facing label: "Tutorial Trail"
  description: string;  // short flavor text

  // CSS hook: which class or data attribute to use for backgrounds
  bgClass: string;      // e.g. "land-bg-0", "land-bg-1"
  mapLabel: string;     // label for the map screen ("Tutorial", "Land 1", etc.)
};

export const LANDS: LandMeta[] = [
  {
    id: 0,
    code: "tutorial",
    name: "Tutorial Trail",
    description: "Learn the basics and get your bearings.",
    bgClass: "land-bg-0",
    mapLabel: "Tutorial",
  },
  {
    id: 1,
    code: "dawn_trail",
    name: "Dawn Trail",
    description: "Gentle paths with rising challenge.",
    bgClass: "land-bg-1",
    mapLabel: "Land 1",
  },
  {
    id: 2,
    code: "ember_ridge",
    name: "Ember Ridge",
    description: "Hotter puzzles, steeper climbs.",
    bgClass: "land-bg-2",
    mapLabel: "Land 2",
  },
  {
    id: 3,
    code: "starfall_way",
    name: "Starfall Way",
    description: "Late-game routes under a strange sky.",
    bgClass: "land-bg-3",
    mapLabel: "Land 3",
  },
];

export function getLandMeta(id: number): LandMeta {
  const found = LANDS.find(l => l.id === id);
  // If someone passes a weird id, default to tutorial
  return found ?? LANDS[0];
}
