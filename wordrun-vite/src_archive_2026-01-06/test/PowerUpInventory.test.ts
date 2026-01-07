import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PowerUpInventory } from '../gameplay/PowerUpInventory'

const setupDom = () => {
  document.body.innerHTML = `
    <div id="powerBar">
      <div class="powerSlot"></div>
      <div class="powerSlot"></div>
      <div class="powerSlot"></div>
    </div>
    <div id="overlayPowerup" style="display:none;">
      <button id="powerupUseBtn"></button>
      <button id="powerupSkipBtn"></button>
    </div>
  `
}

describe('PowerUpInventory', () => {
  beforeEach(() => {
    setupDom()
  })

  it('renders empty slots when count is zero', () => {
    const powerBarEl = document.getElementById('powerBar') as HTMLDivElement
    const overlayEl = document.getElementById('overlayPowerup') as HTMLDivElement
    const useButton = document.getElementById('powerupUseBtn') as HTMLButtonElement
    const skipButton = document.getElementById('powerupSkipBtn') as HTMLButtonElement
    const inventory = new PowerUpInventory({
      powerBarEl,
      overlayEl,
      useButton,
      skipButton,
      onSlotClick: vi.fn(),
      onConfirmUse: vi.fn(),
      onSkipUse: vi.fn(),
    })

    inventory.setLockKeyCount(0)
    const firstSlot = powerBarEl.querySelector('.powerSlot') as HTMLDivElement
    expect(firstSlot.classList.contains('powerSlot-empty')).toBe(true)
  })

  it('opens and closes the prompt', () => {
    const powerBarEl = document.getElementById('powerBar') as HTMLDivElement
    const overlayEl = document.getElementById('overlayPowerup') as HTMLDivElement
    const useButton = document.getElementById('powerupUseBtn') as HTMLButtonElement
    const skipButton = document.getElementById('powerupSkipBtn') as HTMLButtonElement
    const inventory = new PowerUpInventory({
      powerBarEl,
      overlayEl,
      useButton,
      skipButton,
      onSlotClick: vi.fn(),
      onConfirmUse: vi.fn(),
      onSkipUse: vi.fn(),
    })

    inventory.openPrompt(2)
    expect(overlayEl.style.display).toBe('flex')
    inventory.closePrompt()
    expect(overlayEl.style.display).toBe('none')
  })

  it('calls confirm and skip callbacks', () => {
    const powerBarEl = document.getElementById('powerBar') as HTMLDivElement
    const overlayEl = document.getElementById('overlayPowerup') as HTMLDivElement
    const useButton = document.getElementById('powerupUseBtn') as HTMLButtonElement
    const skipButton = document.getElementById('powerupSkipBtn') as HTMLButtonElement
    const onConfirmUse = vi.fn()
    const onSkipUse = vi.fn()
    const inventory = new PowerUpInventory({
      powerBarEl,
      overlayEl,
      useButton,
      skipButton,
      onSlotClick: vi.fn(),
      onConfirmUse,
      onSkipUse,
    })

    inventory.openPrompt(3)
    useButton.click()
    expect(onConfirmUse).toHaveBeenCalledWith(3)

    inventory.openPrompt(4)
    skipButton.click()
    expect(onSkipUse).toHaveBeenCalled()
  })
})
