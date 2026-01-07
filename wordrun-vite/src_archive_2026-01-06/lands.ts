// src/lands.ts

export type LandId = 0 | 1 | 2 | 3; // 0 = Tutorial
export type LandKind = 'tutorial' | 'main';

export type LandConfig = {
  id: LandId;
  kind: LandKind;
  code: string;           // "tutorial", "dawn_trail", etc.
  name: string;           // Display name
  description: string;

  // Visuals
  bgUri: string;          // gameplay background
  mapBgUri: string;       // map screen background
  uiFrameUri: string;     // window frame / panel art
  wheelUri: string;       // wheel art
  avatarSpriteSheet: string; // sprite sheet URL for walk cycles

  // Map layout: one node per level in this land
  nodes: { level: number; x: number; y: number }[];
};

// 4 lands: 0 = tutorial, 1–3 = main
export const LANDS: LandConfig[] = [
  {
    id: 0,
    code: "tutorial",
    name: "Tutorial Trail",
    description: "Learn the rules and warm up your mind.",
    bgUri: "https://YOUR-BUCKET/gameplay/tutorial_bg.png",
    mapBgUri: "https://YOUR-BUCKET/maps/tutorial_map.png",
    uiFrameUri: "https://YOUR-BUCKET/ui/tutorial_frame.png",
    wheelUri: "https://YOUR-BUCKET/wheels/tutorial_wheel.png",
    avatarSpriteSheet: "https://YOUR-BUCKET/avatars/walker_tutorial.png",
    nodes: [
      { level: 1, x: 120, y: 380 },
      { level: 2, x: 200, y: 330 },
      { level: 3, x: 280, y: 280 },
      { level: 4, x: 360, y: 240 },
      { level: 5, x: 440, y: 200 },
    ],
  },
  {
    id: 1,
    code: "dawn_trail",
    name: "Dawn Trail",
    description: "Early routes, low stakes, rising difficulty.",
    bgUri: "https://YOUR-BUCKET/gameplay/land1_bg.png",
    mapBgUri: "https://YOUR-BUCKET/maps/land1_map.png",
    uiFrameUri: "https://YOUR-BUCKET/ui/land1_frame.png",
    wheelUri: "https://YOUR-BUCKET/wheels/land1_wheel.png",
    avatarSpriteSheet: "https://YOUR-BUCKET/avatars/walker_land1.png",
    nodes: [
      { level: 1, x: 100, y: 380 },
      { level: 2, x: 180, y: 340 },
      { level: 3, x: 260, y: 320 },
      { level: 4, x: 340, y: 290 },
      { level: 5, x: 420, y: 260 },
      { level: 6, x: 500, y: 230 },
      { level: 7, x: 580, y: 210 },
      { level: 8, x: 660, y: 190 },
      { level: 9, x: 740, y: 170 },
      { level: 10, x: 820, y: 155 },
      // ... up to however many you want per land
    ],
  },
  // Land 2, Land 3 similarly...
];
