import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ComboBar } from '../ui/ComboBar'

describe('ComboBar', () => {
  let comboEl: HTMLDivElement
  let comboFillEl: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="combo">
        <div id="comboFill"></div>
      </div>
    `
    comboEl = document.getElementById('combo') as HTMLDivElement
    comboFillEl = document.getElementById('comboFill') as HTMLDivElement
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    ;(window as any).__comboValue__ = undefined
  })

  it('sets value and updates the fill width', () => {
    const bar = new ComboBar({ comboEl, comboFillEl })
    bar.setValue(0.5)
    expect(comboFillEl.style.width).toBe('50%')
  })

  it('gains combo and caps at max', () => {
    const bar = new ComboBar({ comboEl, comboFillEl })
    bar.setValue(0.95)
    bar.gain(0.2)
    expect(bar.getValue()).toBe(1)
  })

  it('reports tiers based on thresholds', () => {
    const bar = new ComboBar({ comboEl, comboFillEl })
    bar.setValue(0.2)
    expect(bar.getTier()).toBe(0)
    bar.setValue(0.42)
    expect(bar.getTier()).toBe(1)
    bar.setValue(0.7)
    expect(bar.getTier()).toBe(2)
    bar.setValue(0.9)
    expect(bar.getTier()).toBe(3)
  })

  it('drains over time', () => {
    const nowSpy = vi.spyOn(performance, 'now')
    nowSpy.mockReturnValue(0)
    const bar = new ComboBar({ comboEl, comboFillEl })
    bar.setValue(1)
    bar.drainTick(1000)
    expect(bar.getValue()).toBeLessThan(1)
  })

  it('initializes from persisted combo value', () => {
    ;(window as any).__comboValue__ = 0.9
    const bar = new ComboBar({ comboEl, comboFillEl })
    bar.initializeFromPersisted()
    expect(bar.getValue()).toBe(0.9)
  })
})
