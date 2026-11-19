import { describe, expect, it, vi } from 'vitest'
import {
  API_BASE_PATH,
  REQUEST_TIMEOUT_MS,
  buildQuery,
  createApiClient,
  createZafTransport,
  normalizeHost
} from '../src/api/client'
import { ApiError, ERROR_KINDS, toApiError } from '../src/api/errors'

const ok = (data = { db: 'ok' }) => ({ success: true, data, meta: { from: '2026-11-13', to: '2026-11-19' } })
const jsonError = (status, code, error = 'texto') => ({ status, responseJSON: { success: false, code, error } })
const noSleep = () => Promise.resolve()

const make = (transport, extra = {}) => createApiClient({ transport, sleep: noSleep, ...extra })

describe('classificação de erros', () => {
  it.each([
    [jsonError(401, 'UNAUTHORIZED'), ERROR_KINDS.UNAUTHORIZED],
    [jsonError(429, 'RATE_LIMITED'), ERROR_KINDS.RATE_LIMITED],
    [jsonError(400, 'BAD_REQUEST', 'Período inválido.'), ERROR_KINDS.BAD_REQUEST],
    [jsonError(404, 'NOT_FOUND'), ERROR_KINDS.NOT_FOUND],
    [jsonError(503, 'SERVICE_UNAVAILABLE'), ERROR_KINDS.UNAVAILABLE],
    [{ status: 503, responseText: '<html>starting</html>' }, ERROR_KINDS.WAKING],
    [{ status: 502 }, ERROR_KINDS.WAKING],
    [{ status: 504 }, ERROR_KINDS.WAKING],
    [{ status: 0, statusText: 'timeout' }, ERROR_KINDS.WAKING],
    [{ status: 500 }, ERROR_KINDS.UNKNOWN]
  ])('%j -> %s', (raw, kind) => {
    expect(toApiError(raw).kind).toBe(kind)
  })

  it('só "acordando" é repetível e o texto do servidor é guardado para 400/404', () => {
    expect(toApiError({ status: 0 }).retryable).toBe(true)
    expect(toApiError(jsonError(401, 'UNAUTHORIZED')).retryable).toBe(false)
    expect(toApiError(jsonError(503, 'SERVICE_UNAVAILABLE')).retryable).toBe(false)
    expect(toApiError(jsonError(400, 'BAD_REQUEST', 'Marca inválida.')).serverMessage).toBe('Marca inválida.')
  })
})

describe('createApiClient', () => {
  it('devolve data e meta do envelope do contrato', async () => {
    const transport = vi.fn().mockResolvedValue(ok({ db: 'ok', ms: 12 }))
    const { data, meta } = await make(transport).get('/health')
    expect(data).toEqual({ db: 'ok', ms: 12 })
    expect(meta.from).toBe('2026-11-13')
    expect(transport).toHaveBeenCalledWith({ path: '/health', params: undefined })
  })

  it('aceita corpo em texto JSON', async () => {
    const { data } = await make(vi.fn().mockResolvedValue(JSON.stringify(ok({ x: 1 })))).get('/x')
    expect(data).toEqual({ x: 1 })
  })

  it.each([
    [401, ERROR_KINDS.UNAUTHORIZED],
    [429, ERROR_KINDS.RATE_LIMITED]
  ])('%i não é repetido', async (status, kind) => {
    const transport = vi.fn().mockRejectedValue(jsonError(status, 'X'))
    await expect(make(transport).get('/summary')).rejects.toMatchObject({ kind })
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it('503 do contrato (sem segredo no servidor) não é repetido', async () => {
    const transport = vi.fn().mockRejectedValue(jsonError(503, 'SERVICE_UNAVAILABLE'))
    await expect(make(transport).get('/summary')).rejects.toMatchObject({ kind: ERROR_KINDS.UNAVAILABLE })
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it('cold start: 503 sem JSON do Render faz 1 retry automático e funciona', async () => {
    const sleep = vi.fn(noSleep)
    const transport = vi
      .fn()
      .mockRejectedValueOnce({ status: 503, responseText: '<html>Service waking up</html>' })
      .mockResolvedValueOnce(ok())
    const result = await createApiClient({ transport, sleep, retryDelayMs: 3000 }).get('/health')
    expect(result.data).toEqual({ db: 'ok' })
    expect(transport).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(3000)
  })

  it('se o servidor continua acordando, desiste depois de 1 retry e pede "Tentar de novo"', async () => {
    const transport = vi.fn().mockRejectedValue({ status: 502 })
    await expect(make(transport).get('/health')).rejects.toMatchObject({ kind: ERROR_KINDS.WAKING, retryable: true })
    expect(transport).toHaveBeenCalledTimes(2) // 1 tentativa + 1 retry
  })

  it('timeout longo: resposta que nunca chega vira "acordando" e é repetida uma vez', async () => {
    vi.useFakeTimers()
    try {
      const transport = vi.fn(() => new Promise(() => {}))
      const promise = createApiClient({ transport, timeoutMs: 60_000, retryDelayMs: 1, sleep: noSleep }).get('/health')
      const assertion = expect(promise).rejects.toMatchObject({ kind: ERROR_KINDS.WAKING })
      await vi.advanceTimersByTimeAsync(60_000)
      await vi.advanceTimersByTimeAsync(60_000)
      await assertion
      expect(transport).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('o timeout padrão é de 60 s', () => {
    expect(REQUEST_TIMEOUT_MS).toBe(60_000)
  })

  it('resposta 200 com success:false vira erro', async () => {
    const transport = vi.fn().mockResolvedValue({ success: false, code: 'BAD_REQUEST', error: 'Ruim.' })
    await expect(make(transport).get('/x')).rejects.toBeInstanceOf(ApiError)
  })

  it('getText exige texto e pede dataType text', async () => {
    const transport = vi.fn().mockResolvedValue('﻿a;b\n')
    expect(await make(transport).getText('/export.csv', { report: 'sends' })).toBe('﻿a;b\n')
    expect(transport).toHaveBeenCalledWith({ path: '/export.csv', params: { report: 'sends' }, dataType: 'text' })
    await expect(make(vi.fn().mockResolvedValue({ a: 1 })).getText('/export.csv')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('transporte ZAF (segredo fica fora do navegador)', () => {
  const settings = async () => ({ api_host: 'https://exemplo.invalid/' })

  it('usa secure:true e o placeholder do segredo, nunca um valor', async () => {
    const zaf = { request: vi.fn().mockResolvedValue(ok()) }
    await createZafTransport(
      zaf,
      settings
    )({ path: '/summary', params: { from: '2026-11-13', brand: '', flow: undefined } })
    const options = zaf.request.mock.calls[0][0]
    expect(options.url).toBe(`https://exemplo.invalid${API_BASE_PATH}/summary?from=2026-11-13`)
    expect(options).toMatchObject({ type: 'GET', secure: true, timeout: 60_000 })
    expect(options.headers).toEqual({ Authorization: 'Bearer {{setting.api_secret}}' })
    expect(JSON.stringify(options)).not.toMatch(/api_secret["']?\s*:\s*["'][^{]/)
  })

  it('CSV pede dataType text', async () => {
    const zaf = { request: vi.fn().mockResolvedValue('x') }
    await createZafTransport(zaf, settings)({ path: '/export.csv', dataType: 'text' })
    expect(zaf.request.mock.calls[0][0].dataType).toBe('text')
  })

  it('o transporte nem consulta as configurações de segredo: só api_host', async () => {
    const getSettings = vi.fn().mockResolvedValue({ api_host: 'https://exemplo.invalid' })
    await createZafTransport({ request: vi.fn().mockResolvedValue(ok()) }, getSettings)({ path: '/health' })
    expect(getSettings).toHaveBeenCalledTimes(1)
  })
})

describe('normalizeHost e buildQuery', () => {
  it('aceita https e localhost; remove barra e caminho', () => {
    expect(normalizeHost('https://exemplo.invalid/')).toBe('https://exemplo.invalid')
    expect(normalizeHost(' https://exemplo.invalid/api ')).toBe('https://exemplo.invalid')
    expect(normalizeHost('http://localhost:4000')).toBe('http://localhost:4000')
  })

  it.each(['', 'exemplo.invalid', 'http://exemplo.invalid', 'ftp://exemplo.invalid', undefined])(
    'rejeita %s',
    (host) => {
      expect(() => normalizeHost(host)).toThrow(ApiError)
      try {
        normalizeHost(host)
      } catch (e) {
        expect(e.kind).toBe(ERROR_KINDS.CONFIG)
      }
    }
  )

  it('buildQuery ignora vazios e codifica valores', () => {
    expect(buildQuery({ a: 1, b: '', c: null, d: undefined, q: 'maria silva' })).toBe('?a=1&q=maria+silva')
    expect(buildQuery({})).toBe('')
  })
})
