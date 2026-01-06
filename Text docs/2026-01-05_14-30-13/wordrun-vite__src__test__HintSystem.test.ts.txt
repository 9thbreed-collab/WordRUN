import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HintSystem } from '../gameplay/HintSystem'

const buildDom = () => {
  document.body.innerHTML = `
    <button id="hintBtn"></button>
    <span id="hintBadge"></span>
    <span id="hintText"></span>
    <div id="overlay"></div>
    <button id="modalClose"></button>
    <button id="hintNoThanks"></button>
    <div id="modalPlay"></div>
    <div id="hintCd"></div>
  `
  return {
    hintButton: document.getElementById('hintBtn') as HTMLButtonElement,
    hintBadge: document.getElementById('hintBadge') as HTMLSpanElement,
    hintText: document.getElementById('hintText') as HTMLSpanElement,
    modalOverlay: document.getElementById('overlay') as HTMLDivElement,
    modalCloseButton: document.getElementById('modalClose') as HTMLButtonElement,
    modalNoThanksButton: document.getElementById('hintNoThanks') as HTMLButtonElement,
    modalPlayButton: document.getElementById('modalPlay') as HTMLDivElement,
    cooldownText: document.getElementById('hintCd') as HTMLDivElement,
  }
}

describe('HintSystem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('consumes a hint and updates badge', () => {
    const el = buildDom()
    const onRequestHint = vi.fn(() => 'clue')
    const hintSystem = new HintSystem({
      ...el,
      cooldownMs: 1000,
      initialHintCount: 2,
      onRequestHint,
    })

    el.hintButton.click()
    expect(onRequestHint).toHaveBeenCalled()
    expect(el.hintText.textContent).toBe('clue')
    expect(el.hintBadge.textContent).toBe('1')
    hintSystem.shutdown()
  })

  it('opens and closes the modal', () => {
    const el = buildDom()
    const hintSystem = new HintSystem({
      ...el,
      cooldownMs: 1000,
      initialHintCount: 0,
      onRequestHint: () => 'clue',
    })

    hintSystem.useHint()
    expect(el.modalOverlay.style.display).toBe('flex')
    el.modalCloseButton.click()
    expect(el.modalOverlay.style.display).toBe('none')
    hintSystem.shutdown()
  })
})
