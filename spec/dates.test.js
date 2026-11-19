import { describe, expect, it } from 'vitest'
import { addDays, dateKey, daysBetween, periodRange, today } from '../src/lib/dates'
import { formatShortDate, ratio } from '../src/lib/format'

describe('datas no fuso de São Paulo', () => {
  it('dia local, não o dia UTC', () => {
    expect(dateKey('2026-11-19T01:30:00Z')).toBe('2026-11-18') // 22:30 em SP
    expect(dateKey('2026-11-19T12:00:00Z')).toBe('2026-11-19')
    expect(today(Date.parse('2026-11-19T02:00:00Z'))).toBe('2026-11-18')
  })

  it('addDays atravessa mês e ano', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('períodos incluem hoje (inclusivo)', () => {
    const now = Date.parse('2026-11-19T15:00:00Z')
    expect(periodRange('today', now)).toEqual({ from: '2026-11-19', to: '2026-11-19' })
    expect(periodRange('7d', now)).toEqual({ from: '2026-11-13', to: '2026-11-19' })
    expect(periodRange('30d', now)).toEqual({ from: '2026-10-21', to: '2026-11-19' })
    expect(daysBetween('2026-11-13', '2026-11-19')).toBe(7)
    expect(() => periodRange('1y')).toThrow()
  })
})

describe('formatadores auxiliares', () => {
  it('ratio protege divisão por zero', () => {
    expect(ratio(1, 4)).toBe(0.25)
    expect(ratio(0, 0)).toBeNull()
    expect(ratio(3, undefined)).toBeNull()
  })

  it('data curta', () => {
    expect(formatShortDate('2026-11-19')).toBe('19/11')
    expect(formatShortDate('x')).toBe('–')
  })
})
