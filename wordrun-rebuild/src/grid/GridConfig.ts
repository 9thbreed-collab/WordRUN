/**
 * Grid System Configuration for WordRun
 * True Isometric Grid (Option A)
 *
 * Screen: 390 x 844 pixels (mobile portrait)
 */

import type {
  TileDimensions,
  ZoneDefinition,
  SnapConfig,
  GridDebugOptions,
} from './types';

/**
 * Screen dimensions
 */
export const SCREEN = {
  WIDTH: 390,
  HEIGHT: 844,
} as const;

/**
 * Isometric tile dimensions
 * 2:1 ratio for proper isometric projection
 */
export const TILE: TileDimensions = {
  width: 64,
  height: 32,
  cubeHeight: 20,
};

/**
 * Height nudge configuration
 */
export const HEIGHT_CONFIG = {
  /** Pixels per height unit */
  PIXELS_PER_UNIT: 12,
  /** Minimum height value */
  MIN: -2.0,
  /** Maximum height value */
  MAX: 2.0,
  /** Default height snap increment */
  SNAP_INCREMENT: 0.25,
} as const;

/**
 * Nudge range configuration
 */
export const NUDGE_CONFIG = {
  /** Minimum nudge value (grid units) */
  MIN: -1.0,
  /** Maximum nudge value (grid units) */
  MAX: 1.0,
  /** Default nudge increment */
  INCREMENT: 0.25,
} as const;

/**
 * Zone definitions for screen regions
 * Values based on mobile safe areas and UI layout
 */
export const ZONES: ZoneDefinition[] = [
  {
    name: 'safeTop',
    y: 0,
    height: 44,
    allowHeightNudge: false,
    minHeight: 0,
    maxHeight: 0,
  },
  {
    name: 'header',
    y: 44,
    height: 70,
    allowHeightNudge: false,
    minHeight: 0,
    maxHeight: 0,
  },
  {
    name: 'gameplay',
    y: 114,
    height: 550,
    allowHeightNudge: true,
    minHeight: HEIGHT_CONFIG.MIN,
    maxHeight: HEIGHT_CONFIG.MAX,
  },
  {
    name: 'input',
    y: 664,
    height: 120,
    allowHeightNudge: false,
    minHeight: 0,
    maxHeight: 0,
  },
  {
    name: 'footer',
    y: 784,
    height: 40,
    allowHeightNudge: false,
    minHeight: 0,
    maxHeight: 0,
  },
  {
    name: 'safeBottom',
    y: 824,
    height: 20,
    allowHeightNudge: false,
    minHeight: 0,
    maxHeight: 0,
  },
];

/**
 * Default snap configuration
 */
export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  gridSnap: true,
  subGridSnap: 0.25,
  heightSnap: HEIGHT_CONFIG.SNAP_INCREMENT,
};

/**
 * Default debug visualization options
 */
export const DEFAULT_DEBUG_OPTIONS: GridDebugOptions = {
  showGridLines: false,
  showHeightIndicators: false,
  showSnapPoints: false,
  showZoneBoundaries: false,
  showCoordinateLabels: false,
  debugOpacity: 0.5,
};

/**
 * Grid center offset from screen center
 * Adjusted to position gameplay area optimally
 */
export const GRID_CENTER = {
  x: SCREEN.WIDTH / 2,
  y: 280, // Positioned within gameplay zone
} as const;

/**
 * Render depth calculation constants
 */
export const DEPTH_CONFIG = {
  /** Multiplier for base depth (from grid position) */
  BASE_MULTIPLIER: 100,
  /** Multiplier for height depth contribution */
  HEIGHT_MULTIPLIER: 10,
  /** Offset to ensure all depths are positive */
  HEIGHT_OFFSET: 2,
} as const;

/**
 * Height color indicators
 * Red (lowered) -> White (neutral) -> Blue (raised)
 */
export const HEIGHT_COLORS = {
  LOWERED: { r: 255, g: 68, b: 68 },   // #FF4444
  NEUTRAL: { r: 255, g: 255, b: 255 }, // #FFFFFF
  RAISED: { r: 68, g: 68, b: 255 },    // #4444FF
} as const;

/**
 * Grid line colors for debug overlay
 */
export const DEBUG_COLORS = {
  GRID_LINE: 'rgba(255, 255, 255, 0.15)',
  ZONE_BOUNDARY: 'rgba(255, 255, 255, 0.2)',
  SNAP_POINT: 'rgba(78, 205, 196, 0.5)',
  COORDINATE_LABEL: '#4ECDC4',
  X_AXIS: '#FF6B6B',
  Y_AXIS: '#4ECDC4',
} as const;

/**
 * Default grid size (for map scenes)
 */
export const DEFAULT_GRID_SIZE = {
  columns: 7,
  rows: 7,
} as const;
