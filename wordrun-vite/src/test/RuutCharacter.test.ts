import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RuutCharacter } from '../ui/RuutCharacter'

describe('RuutCharacter', () => {
  let el: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = `<div id="ruutCompanion"></div>`
    el = document.getElementById('ruutCompanion') as HTMLDivElement
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('initializes and applies idle mood', () => {
    const ruut = new RuutCharacter(el, {
      getCosmetic: () => ({ skinKey: 'ruut_walk' }),
      onProfileChanged: () => () => {},
    })
    ruut.init()
    expect(el.classList.contains('idle')).toBe(true)
  })

  it('returns to idle after happy mood', () => {
    const ruut = new RuutCharacter(el, {
      getCosmetic: () => ({ skinKey: 'ruut_walk' }),
      onProfileChanged: () => () => {},
    })
    ruut.init()
    ruut.setMood('happy')
    expect(el.classList.contains('happy')).toBe(true)
    vi.advanceTimersByTime(700)
    expect(el.classList.contains('idle')).toBe(true)
  })

  it('unsubscribes on shutdown', () => {
    const unsub = vi.fn()
    const ruut = new RuutCharacter(el, {
      getCosmetic: () => ({ skinKey: 'ruut_walk' }),
      onProfileChanged: () => unsub,
    })
    ruut.init()
    ruut.shutdown()
    expect(unsub).toHaveBeenCalled()
  })
})
