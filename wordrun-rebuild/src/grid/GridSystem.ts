/**
 * GridSystem - Isometric Grid Implementation for WordRun
 *
 * Provides coordinate conversion, snapping, nudging, and component placement
 * for the true isometric (diamond) grid system.
 */

import type {
  GridPosition,
  ScreenPosition,
  SnapConfig,
  ZoneName,
  ZoneDefinition,
  RenderDepth,
  PlacedComponent,
  GridDebugOptions,
  GridEvent,
  GridEventListener,
} from './types';

import {
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
} from './GridConfig';

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Snap a value to the nearest increment
 */
function snapToIncrement(value: number, increment: number | null): number {
  if (increment === null || increment === 0) return value;
  return Math.round(value / increment) * increment;
}

/**
 * Interpolate between two colors based on a factor (0-1)
 */
function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  factor: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * factor),
    g: Math.round(color1.g + (color2.g - color1.g) * factor),
    b: Math.round(color1.b + (color2.b - color1.b) * factor),
  };
}

/**
 * GridSystem Class
 *
 * Singleton that manages the isometric grid coordinate system.
 */
export class GridSystem {
  private static instance: GridSystem | null = null;

  private snapConfig: SnapConfig;
  private debugOptions: GridDebugOptions;
  private placedComponents: Map<string, PlacedComponent>;
  private eventListeners: Map<string, GridEventListener[]>;
  private centerX: number;
  private centerY: number;

  private constructor() {
    this.snapConfig = { ...DEFAULT_SNAP_CONFIG };
    this.debugOptions = { ...DEFAULT_DEBUG_OPTIONS };
    this.placedComponents = new Map();
    this.eventListeners = new Map();
    this.centerX = GRID_CENTER.x;
    this.centerY = GRID_CENTER.y;
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): GridSystem {
    if (!GridSystem.instance) {
      GridSystem.instance = new GridSystem();
    }
    return GridSystem.instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    GridSystem.instance = null;
  }

  // ============================================
  // COORDINATE CONVERSION
  // ============================================

  /**
   * Convert grid position to screen coordinates
   */
  gridToScreen(pos: GridPosition): ScreenPosition {
    // Apply nudge to grid position
    const effectiveGridX = pos.gridX + pos.nudgeX;
    const effectiveGridY = pos.gridY + pos.nudgeY;

    // Isometric projection: diamond coordinates
    const screenX = this.centerX + (effectiveGridX - effectiveGridY) * (TILE.width / 2);
    const screenY = this.centerY + (effectiveGridX + effectiveGridY) * (TILE.height / 2);

    // Apply height offset (negative because screen Y increases downward)
    const heightOffset = -pos.height * HEIGHT_CONFIG.PIXELS_PER_UNIT;

    return {
      x: screenX,
      y: screenY + heightOffset,
    };
  }

  /**
   * Convert screen coordinates to grid position
   * Returns the nearest grid position (without nudge)
   */
  screenToGrid(screenX: number, screenY: number): GridPosition {
    // Reverse the isometric projection
    const relX = screenX - this.centerX;
    const relY = screenY - this.centerY;

    // Solve for gridX and gridY
    const gridX = (relX / (TILE.width / 2) + relY / (TILE.height / 2)) / 2;
    const gridY = (relY / (TILE.height / 2) - relX / (TILE.width / 2)) / 2;

    return {
      gridX: Math.round(gridX),
      gridY: Math.round(gridY),
      nudgeX: 0,
      nudgeY: 0,
      height: 0,
    };
  }

  /**
   * Convert screen coordinates to grid position with fractional precision
   * Useful for drag operations
   */
  screenToGridPrecise(screenX: number, screenY: number): GridPosition {
    const relX = screenX - this.centerX;
    const relY = screenY - this.centerY;

    const gridX = (relX / (TILE.width / 2) + relY / (TILE.height / 2)) / 2;
    const gridY = (relY / (TILE.height / 2) - relX / (TILE.width / 2)) / 2;

    const intGridX = Math.floor(gridX);
    const intGridY = Math.floor(gridY);

    return {
      gridX: intGridX,
      gridY: intGridY,
      nudgeX: gridX - intGridX,
      nudgeY: gridY - intGridY,
      height: 0,
    };
  }

  // ============================================
  // SNAP & NUDGE
  // ============================================

  /**
   * Snap a position to the grid based on current snap config
   */
  snapToGrid(pos: GridPosition): GridPosition {
    if (!this.snapConfig.enabled) return { ...pos };

    const snapped: GridPosition = { ...pos };

    if (this.snapConfig.gridSnap) {
      snapped.gridX = Math.round(pos.gridX);
      snapped.gridY = Math.round(pos.gridY);
    }

    snapped.nudgeX = snapToIncrement(pos.nudgeX, this.snapConfig.subGridSnap);
    snapped.nudgeY = snapToIncrement(pos.nudgeY, this.snapConfig.subGridSnap);
    snapped.height = snapToIncrement(pos.height, this.snapConfig.heightSnap);

    // Clamp nudge values
    snapped.nudgeX = clamp(snapped.nudgeX, NUDGE_CONFIG.MIN, NUDGE_CONFIG.MAX);
    snapped.nudgeY = clamp(snapped.nudgeY, NUDGE_CONFIG.MIN, NUDGE_CONFIG.MAX);
    snapped.height = clamp(snapped.height, HEIGHT_CONFIG.MIN, HEIGHT_CONFIG.MAX);

    return snapped;
  }

  /**
   * Apply a nudge delta to a position
   */
  nudge(pos: GridPosition, axis: 'x' | 'y' | 'height', delta: number): GridPosition {
    const newPos: GridPosition = { ...pos };

    switch (axis) {
      case 'x':
        newPos.nudgeX = clamp(pos.nudgeX + delta, NUDGE_CONFIG.MIN, NUDGE_CONFIG.MAX);
        break;
      case 'y':
        newPos.nudgeY = clamp(pos.nudgeY + delta, NUDGE_CONFIG.MIN, NUDGE_CONFIG.MAX);
        break;
      case 'height':
        newPos.height = clamp(pos.height + delta, HEIGHT_CONFIG.MIN, HEIGHT_CONFIG.MAX);
        break;
    }

    return this.snapConfig.enabled ? this.snapToGrid(newPos) : newPos;
  }

  /**
   * Set the height of a position directly
   */
  setHeight(pos: GridPosition, height: number): GridPosition {
    const newPos: GridPosition = { ...pos };
    newPos.height = clamp(height, HEIGHT_CONFIG.MIN, HEIGHT_CONFIG.MAX);

    if (this.snapConfig.enabled && this.snapConfig.heightSnap) {
      newPos.height = snapToIncrement(newPos.height, this.snapConfig.heightSnap);
    }

    return newPos;
  }

  // ============================================
  // ZONES
  // ============================================

  /**
   * Get the zone for a screen position
   */
  getZoneFromScreen(screenY: number): ZoneName {
    for (const zone of ZONES) {
      if (screenY >= zone.y && screenY < zone.y + zone.height) {
        return zone.name;
      }
    }
    // Default to gameplay if somehow outside bounds
    return 'gameplay';
  }

  /**
   * Get the zone for a grid position
   */
  getZone(pos: GridPosition): ZoneName {
    const screen = this.gridToScreen(pos);
    return this.getZoneFromScreen(screen.y);
  }

  /**
   * Get zone definition by name
   */
  getZoneDefinition(name: ZoneName): ZoneDefinition | undefined {
    return ZONES.find(z => z.name === name);
  }

  /**
   * Check if height nudge is allowed at a position
   */
  isHeightNudgeAllowed(pos: GridPosition): boolean {
    const zone = this.getZone(pos);
    const zoneDef = this.getZoneDefinition(zone);
    return zoneDef?.allowHeightNudge ?? false;
  }

  // ============================================
  // RENDER DEPTH
  // ============================================

  /**
   * Calculate render depth for sorting
   * Higher depth = rendered later (on top)
   */
  calculateDepth(pos: GridPosition): RenderDepth {
    // Base depth from grid position (items further back rendered first)
    const baseDepth = (pos.gridX + pos.gridY) * DEPTH_CONFIG.BASE_MULTIPLIER;

    // Height contribution (raised items rendered on top of same-row items)
    const heightDepth = (pos.height + DEPTH_CONFIG.HEIGHT_OFFSET) * DEPTH_CONFIG.HEIGHT_MULTIPLIER;

    return {
      baseDepth,
      heightDepth,
      totalDepth: baseDepth + heightDepth,
    };
  }

  // ============================================
  // COMPONENT PLACEMENT
  // ============================================

  /**
   * Place a component at a grid position
   */
  placeComponent(
    id: string,
    componentId: string,
    pos: GridPosition
  ): PlacedComponent {
    const snappedPos = this.snapToGrid(pos);
    const screenPos = this.gridToScreen(snappedPos);
    const depth = this.calculateDepth(snappedPos);
    const zone = this.getZone(snappedPos);

    const component: PlacedComponent = {
      id,
      componentId,
      position: snappedPos,
      screenPosition: screenPos,
      depth,
      zone,
    };

    this.placedComponents.set(id, component);
    this.emit({ type: 'componentPlaced', componentId: id, position: snappedPos, zone });

    return component;
  }

  /**
   * Move a component to a new position
   */
  moveComponent(id: string, newPos: GridPosition): PlacedComponent | null {
    const component = this.placedComponents.get(id);
    if (!component) return null;

    const previousPosition = { ...component.position };
    const previousZone = component.zone;

    const snappedPos = this.snapToGrid(newPos);
    component.position = snappedPos;
    component.screenPosition = this.gridToScreen(snappedPos);
    component.depth = this.calculateDepth(snappedPos);
    component.zone = this.getZone(snappedPos);

    this.emit({
      type: 'componentMoved',
      componentId: id,
      position: snappedPos,
      previousPosition,
    });

    if (component.zone !== previousZone) {
      this.emit({
        type: 'zoneExited',
        componentId: id,
        previousZone,
      });
      this.emit({
        type: 'zoneEntered',
        componentId: id,
        zone: component.zone,
      });
    }

    return component;
  }

  /**
   * Remove a component
   */
  removeComponent(id: string): boolean {
    const component = this.placedComponents.get(id);
    if (!component) return false;

    this.placedComponents.delete(id);
    this.emit({
      type: 'componentRemoved',
      componentId: id,
      position: component.position,
    });

    return true;
  }

  /**
   * Get a placed component by ID
   */
  getComponent(id: string): PlacedComponent | undefined {
    return this.placedComponents.get(id);
  }

  /**
   * Get all placed components sorted by depth
   */
  getComponentsSortedByDepth(): PlacedComponent[] {
    return Array.from(this.placedComponents.values()).sort(
      (a, b) => a.depth.totalDepth - b.depth.totalDepth
    );
  }

  /**
   * Get components in a specific zone
   */
  getComponentsInZone(zone: ZoneName): PlacedComponent[] {
    return Array.from(this.placedComponents.values()).filter(c => c.zone === zone);
  }

  // ============================================
  // HEIGHT COLORS
  // ============================================

  /**
   * Get the color for a height value
   */
  getHeightColor(height: number): { r: number; g: number; b: number } {
    if (height > 0) {
      const factor = Math.min(height / HEIGHT_CONFIG.MAX, 1);
      return lerpColor(HEIGHT_COLORS.NEUTRAL, HEIGHT_COLORS.RAISED, factor);
    } else if (height < 0) {
      const factor = Math.min(-height / -HEIGHT_CONFIG.MIN, 1);
      return lerpColor(HEIGHT_COLORS.NEUTRAL, HEIGHT_COLORS.LOWERED, factor);
    }
    return HEIGHT_COLORS.NEUTRAL;
  }

  /**
   * Get height color as CSS rgb string
   */
  getHeightColorCSS(height: number): string {
    const color = this.getHeightColor(height);
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  /**
   * Update snap configuration
   */
  setSnapConfig(config: Partial<SnapConfig>): void {
    this.snapConfig = { ...this.snapConfig, ...config };
    this.emit({ type: 'snapToggled' });
  }

  /**
   * Get current snap configuration
   */
  getSnapConfig(): SnapConfig {
    return { ...this.snapConfig };
  }

  /**
   * Update debug options
   */
  setDebugOptions(options: Partial<GridDebugOptions>): void {
    this.debugOptions = { ...this.debugOptions, ...options };
  }

  /**
   * Get current debug options
   */
  getDebugOptions(): GridDebugOptions {
    return { ...this.debugOptions };
  }

  /**
   * Set grid center position
   */
  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;

    // Update all placed components
    for (const component of this.placedComponents.values()) {
      component.screenPosition = this.gridToScreen(component.position);
    }
  }

  /**
   * Get grid center position
   */
  getCenter(): ScreenPosition {
    return { x: this.centerX, y: this.centerY };
  }

  // ============================================
  // EVENTS
  // ============================================

  /**
   * Subscribe to grid events
   */
  on(eventType: string, listener: GridEventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Unsubscribe from grid events
   */
  off(eventType: string, listener: GridEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit a grid event
   */
  private emit(event: GridEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Create a default grid position
   */
  createPosition(
    gridX: number = 0,
    gridY: number = 0,
    height: number = 0
  ): GridPosition {
    return {
      gridX,
      gridY,
      nudgeX: 0,
      nudgeY: 0,
      height,
    };
  }

  /**
   * Check if two positions are at the same grid cell
   */
  sameCell(pos1: GridPosition, pos2: GridPosition): boolean {
    return pos1.gridX === pos2.gridX && pos1.gridY === pos2.gridY;
  }

  /**
   * Calculate Manhattan distance between two grid positions
   */
  gridDistance(pos1: GridPosition, pos2: GridPosition): number {
    return Math.abs(pos1.gridX - pos2.gridX) + Math.abs(pos1.gridY - pos2.gridY);
  }

  /**
   * Get tile dimensions
   */
  getTileDimensions(): { width: number; height: number; cubeHeight: number } {
    return { ...TILE };
  }

  /**
   * Get all zones
   */
  getZones(): ZoneDefinition[] {
    return [...ZONES];
  }

  /**
   * Get height configuration
   */
  getHeightConfig(): typeof HEIGHT_CONFIG {
    return { ...HEIGHT_CONFIG };
  }

  /**
   * Get debug colors
   */
  getDebugColors(): typeof DEBUG_COLORS {
    return { ...DEBUG_COLORS };
  }
}

// Export singleton getter for convenience
export const getGridSystem = (): GridSystem => GridSystem.getInstance();
