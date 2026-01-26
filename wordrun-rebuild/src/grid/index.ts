/**
 * Grid System Module
 * True Isometric Grid for WordRun
 *
 * Usage:
 *   import { GridSystem, getGridSystem } from './grid';
 *   const grid = getGridSystem();
 *
 *   // Place a component
 *   const pos = grid.createPosition(2, 3, 1.0); // gridX=2, gridY=3, height=1.0
 *   grid.placeComponent('cube-1', 'MAP-001', pos);
 *
 *   // Get screen coordinates
 *   const screen = grid.gridToScreen(pos);
 *
 *   // Nudge height
 *   const newPos = grid.nudge(pos, 'height', 0.5);
 */

// Types
export type {
  GridPosition,
  ScreenPosition,
  SnapConfig,
  ZoneName,
  ZoneDefinition,
  RenderDepth,
  PlacedComponent,
  GridDebugOptions,
  TileDimensions,
  HeightColor,
  GridEventType,
  GridEvent,
  GridEventListener,
} from './types';

// Configuration
export {
  SCREEN,
  TILE,
  HEIGHT_CONFIG,
  NUDGE_CONFIG,
  ZONES,
  DEFAULT_SNAP_CONFIG,
  DEFAULT_DEBUG_OPTIONS,
  GRID_CENTER,
  DEPTH_CONFIG,
  HEIGHT_COLORS,
  DEBUG_COLORS,
  DEFAULT_GRID_SIZE,
} from './GridConfig';

// Main Grid System
export { GridSystem, getGridSystem } from './GridSystem';
