/**
 * Grid System Types for WordRun
 * True Isometric Grid with Diamond Coordinates
 *
 * Coordinate System:
 * - X-axis points toward upper-right at 30 degrees
 * - Y-axis points toward upper-left at 30 degrees
 * - Height (Z) raises/lowers components vertically
 */

/**
 * A position in the isometric grid with optional nudge adjustments
 */
export interface GridPosition {
  /** Grid column (X coordinate in isometric space) */
  gridX: number;
  /** Grid row (Y coordinate in isometric space) */
  gridY: number;
  /** Fine horizontal adjustment within cell (-1.0 to 1.0 grid units) */
  nudgeX: number;
  /** Fine vertical adjustment within cell (-1.0 to 1.0 grid units) */
  nudgeY: number;
  /** Z-axis height adjustment (-2.0 to 2.0 grid units) */
  height: number;
}

/**
 * Screen coordinates (pixels)
 */
export interface ScreenPosition {
  x: number;
  y: number;
}

/**
 * Configuration for snap behavior
 */
export interface SnapConfig {
  /** Whether snapping is enabled */
  enabled: boolean;
  /** Snap to integer grid positions */
  gridSnap: boolean;
  /** Sub-grid snap increment (0.25 or 0.5) */
  subGridSnap: 0.25 | 0.5 | null;
  /** Height snap increment */
  heightSnap: number;
}

/**
 * Zone names for screen regions
 */
export type ZoneName = 'safeTop' | 'header' | 'gameplay' | 'input' | 'footer' | 'safeBottom';

/**
 * Definition of a screen zone
 */
export interface ZoneDefinition {
  /** Zone identifier */
  name: ZoneName;
  /** Top Y coordinate (pixels) */
  y: number;
  /** Height of zone (pixels) */
  height: number;
  /** Whether height nudge is allowed in this zone */
  allowHeightNudge: boolean;
  /** Minimum height value if height nudge allowed */
  minHeight: number;
  /** Maximum height value if height nudge allowed */
  maxHeight: number;
}

/**
 * Render depth information for sorting
 */
export interface RenderDepth {
  /** Base depth from grid position */
  baseDepth: number;
  /** Height contribution to depth */
  heightDepth: number;
  /** Final calculated depth for sorting */
  totalDepth: number;
}

/**
 * Grid tile dimensions
 */
export interface TileDimensions {
  /** Width of tile in pixels (diamond width) */
  width: number;
  /** Height of tile in pixels (diamond height) */
  height: number;
  /** Cube face height in pixels */
  cubeHeight: number;
}

/**
 * Debug visualization options
 */
export interface GridDebugOptions {
  /** Show grid lines */
  showGridLines: boolean;
  /** Show height indicators with color coding */
  showHeightIndicators: boolean;
  /** Show snap points */
  showSnapPoints: boolean;
  /** Show zone boundaries */
  showZoneBoundaries: boolean;
  /** Show coordinate labels */
  showCoordinateLabels: boolean;
  /** Opacity for debug overlay (0-1) */
  debugOpacity: number;
}

/**
 * Component placement data
 */
export interface PlacedComponent {
  /** Unique identifier for this placement */
  id: string;
  /** Component type ID (e.g., "MAP-001", "UI-005") */
  componentId: string;
  /** Position in grid */
  position: GridPosition;
  /** Calculated screen position (updated by GridSystem) */
  screenPosition: ScreenPosition;
  /** Render depth for sorting */
  depth: RenderDepth;
  /** Zone this component is in */
  zone: ZoneName;
}

/**
 * Height color indicator
 */
export interface HeightColor {
  /** Height value */
  height: number;
  /** RGB color for this height */
  color: { r: number; g: number; b: number };
}

/**
 * Grid event types
 */
export type GridEventType =
  | 'componentPlaced'
  | 'componentMoved'
  | 'componentRemoved'
  | 'heightChanged'
  | 'snapToggled'
  | 'zoneEntered'
  | 'zoneExited';

/**
 * Grid event payload
 */
export interface GridEvent {
  type: GridEventType;
  componentId?: string;
  position?: GridPosition;
  previousPosition?: GridPosition;
  zone?: ZoneName;
  previousZone?: ZoneName;
}

/**
 * Grid event listener function type
 */
export type GridEventListener = (event: GridEvent) => void;
