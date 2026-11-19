import { describe, expect, it } from 'vitest'
import { formatDateTime, formatDuration, formatNumber, formatRate, formatTime } from '../src/lib/format'

describe('format', () => {
  it('taxas em pt-BR e null vira travessão', () => {
    expect(formatRate(0.607)).toBe('60,7%')
    expect(formatRate(0)).toBe('0%')
    expect(formatRate(null)).toBe('–')
    expect(formatNumber(1234)).toBe('1.234')
  })

  it('data e hora no fuso de São Paulo', () => {
    expect(formatDateTime('2026-11-19T17:32:00Z')).toBe('19/11/2026 14:32')
    expect(formatTime('2026-11-19T17:32:05Z')).toBe('14:32:05')
    expect(formatDateTime('lixo')).toBe('–')
  })

  it('duração', () => {
    expect(formatDuration(31)).toBe('31 s')
    expect(formatDuration(125)).toBe('2 min 5 s')
    expect(formatDuration(null)).toBe('–')
  })
})
