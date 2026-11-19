import { describe, expect, it } from 'vitest'
import { mockTransport } from '../src/api/mock'

const get = async (path, params) => (await mockTransport({ path, params })).data

describe('modo demonstração (mock)', () => {
  it('summary segue as fórmulas do contrato', async () => {
    const { totals } = await get('/summary', { from: '2000-01-01', to: '2100-01-01' }).catch(() => ({ totals: null }))
    expect(totals).toBeNull() // período > 366 dias é rejeitado
    const { totals: t, daily } = await get('/summary', {})
    expect(t.clicked + t.not_clicked + t.send_failed).toBe(t.sends)
    expect(t.click_rate).toBeCloseTo(t.clicked / (t.sends - t.send_failed), 3)
    expect(daily).toHaveLength(7)
    expect(daily.reduce((n, d) => n + d.sends, 0)).toBe(t.sends)
  })

  it('funil: enviados e abriram batem com o summary do fluxo', async () => {
    const { totals } = await get('/summary', { flow: 'reverse' })
    const { steps } = await get('/funnel', { flow: 'reverse' })
    expect(steps[0].sessions).toBe(totals.sends - totals.send_failed)
    expect(steps[1].sessions).toBe(totals.clicked)
    expect(steps[0].drop_off_rate).toBeNull()
  })

  it('lista com cursor percorre tudo sem repetir', async () => {
    const ids = new Set()
    let cursor
    do {
      const page = await get('/sends', { limit: 20, cursor })
      page.items.forEach((i) => ids.add(i.send_id))
      cursor = page.next_cursor
    } while (cursor)
    expect(ids.size).toBe((await get('/summary', {})).totals.sends)
  })

  it('CSV tem BOM, separador ; e protege fórmulas', async () => {
    const text = await mockTransport({ path: '/export.csv', params: { report: 'sends' } })
    expect(text.charCodeAt(0)).toBe(0xfeff)
    expect(text.split('\n')[0]).toContain(';')
  })

  it('erros no formato do contrato', async () => {
    await expect(mockTransport({ path: '/funnel', params: {} })).rejects.toMatchObject({ status: 400 })
    await expect(mockTransport({ path: '/sends/nao-existe' })).rejects.toMatchObject({ status: 404 })
  })
})

describe('CSV do modo demonstração', () => {
  it('só entrega os relatórios do contrato e protege células que começam com fórmula', async () => {
    for (const report of ['sends', 'reverse_sessions', 'catalog_products']) {
      const text = await mockTransport({ path: '/export.csv', params: { report } })
      expect(text.startsWith('﻿')).toBe(true)
      text
        .split('\n')
        .slice(1)
        .filter(Boolean)
        .forEach((line) => line.split(';').forEach((cell) => expect(/^[=+\-@]/.test(cell)).toBe(false)))
    }
    await expect(mockTransport({ path: '/export.csv', params: { report: 'outro' } })).rejects.toMatchObject({
      status: 400
    })
  })
})
