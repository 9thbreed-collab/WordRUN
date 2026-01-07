// FILE: src/ui/NameOverlay.ts

import Phaser from 'phaser';
import type { Profile } from '../supabase';
import { mountDom, basicColumn } from '../utils';
import { updateProfileName } from '../ProfileStore';

export type NameOverlayReason = 'post_tutorial' | 'store_purchase';

/**
 * Small helper: we build names from 3 slots:
 * - adjective (or denominal adjective)
 * - noun
 * - suffix / nickname / number
 *
 * Slots can appear in different orders according to a random pattern.
 */

type NamePartType = 'adj' | 'noun' | 'suffix' | 'nick' | 'number';

const ADJECTIVES: string[] = [
  'Swift',
  'Lucky',
  'Quiet',
  'Bright',
  'Clever',
  'Brave',
  'Calm',
  'Electric',
  'Sharp',
  'Witty',
  'Ancient',
  'Neon',
  'Evergreen',
  'Midnight',
];

const NOUNS: string[] = [
  'Ruut',
  'Runner',
  'Cipher',
  'Wordsmith',
  'Navigator',
  'Sprout',
  'Spark',
  'Comet',
  'Echo',
  'Glyph',
  'Pioneer',
  'Traveler',
  'Pilot',
  'Anchor',
];

const SUFFIXES: string[] = [
  'Prime',
  'Jr.',
  'the Bold',
  'the Wise',
  'the Great',
  'of Ruutia',
  'of the Grid',
  'the Lovely',
];

const NICKNAMES: string[] = [
  '"Thunk"',
  '"Cipher"',
  '"Wildcard"',
  '"Daydream"',
  '"Nightshift"',
  '"Quicksave"',
];

const NUMBERS: string[] = [
  '3000',
  '404',
  '99',
  '77',
  '808',
  '2049',
];

// Different patterns the three slots can take
const PATTERNS: NamePartType[][] = [
  ['adj', 'noun', 'suffix'],
  ['noun', 'nick', 'number'],
  ['adj', 'nick', 'noun'],
  ['nick', 'noun', 'number'],
  ['adj', 'noun', 'number'],
  ['noun', 'adj', 'suffix'],
];

// You can hard-code your own dev name here if desired.
// Example: if you ever want to force your own profile to "treefunk3000",
// you can add a special-case check based on user id or meta later.
function pickRandom<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function buildNameParts(): { parts: string[]; combined: string } {
  const pattern = pickRandom(PATTERNS);

  const parts: string[] = pattern.map((slot) => {
    switch (slot) {
      case 'adj':
        return pickRandom(ADJECTIVES);
      case 'noun':
        return pickRandom(NOUNS);
      case 'suffix':
        return pickRandom(SUFFIXES);
      case 'nick':
        return pickRandom(NICKNAMES);
      case 'number':
        return pickRandom(NUMBERS);
      default:
        return '';
    }
  });

  // Join with spaces, but keep nicknames quoted as-is.
  const combined = parts.join(' ');
  return { parts, combined };
}


// Celebration overlay shown after confirming name
function showCelebrationOverlay(
  scene: Phaser.Scene,
  finalName: string,
  onDone?: () => void
) {
  const { dom, el } = mountDom(
    scene,
    basicColumn(`
      <div style="
        background: rgba(15,23,42,0.96);
        padding: 24px 28px;
        border-radius: 20px;
        min-width: 260px;
        max-width: 360px;
        box-shadow: 0 24px 55px rgba(0,0,0,0.7);
        text-align: center;
        color: #e5e7eb;
      ">
        <div style="font-size: 28px; margin-bottom: 8px;">
          🎉
        </div>
        <h2 style="margin: 0 0 6px 0; font-size: 20px;">
          Name locked in!
        </h2>
        <div style="
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 700;
        ">
          ${finalName}
        </div>
        <p style="margin: 0 0 18px 0; font-size: 13px; opacity: 0.85;">
          Your Ruut will use this name on the map and in 1v1.
        </p>
        <button id="btn-celebration-ok" style="
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          font-size: 14px;
          font-weight: 600;
        ">
          Continue
        </button>
      </div>
    `)
  );

  const okBtn = el.querySelector<HTMLButtonElement>('#btn-celebration-ok');
  if (okBtn) {
    okBtn.onclick = () => {
      dom.destroy();
      if (scene.input) {
        scene.input.enabled = true;
      }
      if (onDone) {
        onDone();
      }
    };
  }

  // Auto-dismiss after a few seconds as a backup
  scene.time.delayedCall(4500, () => {
    if (!dom.scene) return; // already destroyed
    dom.destroy();
    if (scene.input) {
      scene.input.enabled = true;
    }
    if (onDone) {
      onDone();
    }
  });
}





/**
 * Main overlay: choose your name.
 * - Shows 3 slots in the center for the name parts.
 * - Shows a Ruut area below.
 * - Shows "Current name: ..." label.
 * - Buttons:
 *    - Roll new combo
 *    - Use this name
 *    - Keep current name (locks the starter name)
 */
export function showNameOverlay(
  scene: Phaser.Scene,
  profile: Profile,
  opts: { reason: NameOverlayReason },
  onComplete?: (finalName: string) => void
) {
  const starterName = profile.display_name;
  let currentParts = buildNameParts();
  let chosenName = currentParts.combined;

    // 🔒 Disable Phaser input while the name overlay is open
    if (scene.input) {
      scene.input.enabled = false;
    }

  const { dom, el } = mountDom(
    scene,
    basicColumn(`
      <div style="
        background: rgba(15,23,42,0.96);
        padding: 22px 26px;
        border-radius: 20px;
        min-width: 280px;
        max-width: 380px;
        box-shadow: 0 24px 55px rgba(0,0,0,0.7);
        text-align: center;
        color: #e5e7eb;
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 20px;">
          Choose your name
        </h2>

        <p style="margin: 0 0 12px 0; font-size: 13px; opacity: 0.85;">
          This is how other players will see you on the map.
        </p>

        <!-- Three-part name slots -->
        <div style="
          display:flex;
          justify-content:center;
          gap:8px;
          margin-bottom:10px;
        ">
          <div style="
            flex:1;
            padding:8px 10px;
            border-radius:10px;
            border:1px solid rgba(148,163,184,0.9);
            font-size:13px;
            font-weight:600;
          ">
            <div style="font-size:11px; opacity:0.7; margin-bottom:2px;">Slot 1</div>
            <div id="slot-1">${currentParts.parts[0]}</div>
          </div>
          <div style="
            flex:1;
            padding:8px 10px;
            border-radius:10px;
            border:1px solid rgba(148,163,184,0.9);
            font-size:13px;
            font-weight:600;
          ">
            <div style="font-size:11px; opacity:0.7; margin-bottom:2px;">Slot 2</div>
            <div id="slot-2">${currentParts.parts[1]}</div>
          </div>
          <div style="
            flex:1;
            padding:8px 10px;
            border-radius:10px;
            border:1px solid rgba(148,163,184,0.9);
            font-size:13px;
            font-weight:600;
          ">
            <div style="font-size:11px; opacity:0.7; margin-bottom:2px;">Slot 3</div>
            <div id="slot-3">${currentParts.parts[2]}</div>
          </div>
        </div>

        <div style="
          margin: 0 auto 12px auto;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.7);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
        ">
          <span id="combined-name">${currentParts.combined}</span>
        </div>

        <!-- Ruut front view placeholder -->
        <div style="margin: 0 auto 8px auto;">
          <!-- TODO: replace this circle with your front-view Ruut sprite/PNG.
               For example: <img src="assets/ui/ruut_front.png" style="width:72px;height:auto;" /> -->
          <div style="
            width: 64px;
            height: 64px;
            margin: 0 auto;
            border-radius: 16px;
            background: radial-gradient(circle at 30% 20%, #38bdf8, #1d4ed8);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
          ">
            😊
          </div>
        </div>

        <p style="margin: 0 0 14px 0; font-size: 12px; opacity: 0.9;">
          Current name: <span style="font-weight:600;">${starterName}</span>
        </p>

        <button id="btn-roll" style="
          display:block;
          width:100%;
          padding:8px 12px;
          margin-bottom:8px;
          border-radius:999px;
          border:none;
          font-size:14px;
        ">
          🎲 Roll a new combo
        </button>

        <button id="btn-use-new" style="
          display:block;
          width:100%;
          padding:8px 12px;
          margin-bottom:6px;
          border-radius:999px;
          border:none;
          font-size:14px;
          font-weight:600;
        ">
          Use this name
        </button>

        <button id="btn-keep-current" style="
          display:block;
          width:100%;
          padding:6px 10px;
          border-radius:999px;
          border:none;
          font-size:12px;
          opacity:0.9;
        ">
          Keep "${starterName}" as my name. I kinda like it.
        </button>
      </div>
    `)
  );

  const slot1 = el.querySelector<HTMLDivElement>('#slot-1');
  const slot2 = el.querySelector<HTMLDivElement>('#slot-2');
  const slot3 = el.querySelector<HTMLDivElement>('#slot-3');
  const combinedSpan = el.querySelector<HTMLSpanElement>('#combined-name');

  const rollBtn = el.querySelector<HTMLButtonElement>('#btn-roll');
  const useNewBtn = el.querySelector<HTMLButtonElement>('#btn-use-new');
  const keepCurrentBtn = el.querySelector<HTMLButtonElement>('#btn-keep-current');

  function applyPartsToDom() {
    if (slot1) slot1.textContent = currentParts.parts[0];
    if (slot2) slot2.textContent = currentParts.parts[1];
    if (slot3) slot3.textContent = currentParts.parts[2];
    if (combinedSpan) combinedSpan.textContent = currentParts.combined;
  }

  if (rollBtn) {
    rollBtn.onclick = () => {
      currentParts = buildNameParts();
      chosenName = currentParts.combined;
      applyPartsToDom();
    };
  }

  if (useNewBtn) {
    useNewBtn.onclick = async () => {
      useNewBtn.disabled = true;
      keepCurrentBtn && (keepCurrentBtn.disabled = true);
      rollBtn && (rollBtn.disabled = true);
  
      const finalName = chosenName;
  
      const updated = await updateProfileName(finalName, true); // lockName = true
      if (!updated) {
        alert('Could not save name. Please check your connection and try again.');
        useNewBtn.disabled = false;
        keepCurrentBtn && (keepCurrentBtn.disabled = false);
        rollBtn && (rollBtn.disabled = false);
        return;
      }
  
      dom.destroy();
      showCelebrationOverlay(scene, finalName, () => {
        if (onComplete) {
          onComplete(finalName);
        }
      });
    };
  }
  
  if (keepCurrentBtn) {
    keepCurrentBtn.onclick = async () => {
      useNewBtn && (useNewBtn.disabled = true);
      keepCurrentBtn.disabled = true;
      rollBtn && (rollBtn.disabled = true);
  
      const finalName = starterName;
  
      const updated = await updateProfileName(finalName, true); // lockName = true
      if (!updated) {
        alert('Could not save name. Please check your connection and try again.');
        useNewBtn && (useNewBtn.disabled = false);
        keepCurrentBtn.disabled = false;
        rollBtn && (rollBtn.disabled = false);
        return;
      }
  
      dom.destroy();
      showCelebrationOverlay(scene, finalName, () => {
        if (onComplete) {
          onComplete(finalName);
        }
      });
    };
  }
  
}
