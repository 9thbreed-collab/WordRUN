/* =========================================
   FILE: src/config.ts
   PURPOSE: Global config + dev flags
   ========================================= */
   export const GAME_CONFIG = {
    // Basic game identity + default size
    title: 'WordRun',
    width: 390,
    height: 844,
    bg: '#0d0f14',
  
    // Lives & penalty box
    livesPerLand: 5,
    penaltyWaitTiersMinutes: [15, 60, 240, 960], // Wait tiers for penalty box
  
    // Dev-only switches (never meant for players)
    dev: {
      // Master switch for dev-only UI / tools
      enabled: true,                 // <- set to false before submitting to stores
  
      // Flow / QoL for testing
      skipMapScene: true,            // Story Mode jumps straight to map/gameplay while testing
      ignorePenaltyAtStartup: true,  // Don't block you on penalty box at startup
      clearPenaltyOnStartup: false,  // Wipe penalty on refresh (handy if you get stuck)
      fillSampleChain: true,         // Pre-fill sample word chain in some modes
  
      // UI bits that should never ship to players
      showTitleTestButtons: true,    // 'Test MapTransition' + 'Admin Console' on title screen
      showHudAdminButtons: true,     // Theme / Admin / Mode buttons in gameplay HUD
      enableDebugOverlay: false,     // Log overlay + scene logging (DebugHUD / LogBus)
    },
  };
  