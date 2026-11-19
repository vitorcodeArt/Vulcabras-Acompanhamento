import { ApiError, ERROR_KINDS, toApiError } from './errors'

export const API_BASE_PATH = '/api/analytics'
export const REQUEST_TIMEOUT_MS = 60_000 // o plano gratuito do Render pode levar ~1 min para acordar
export const RETRY_DELAY_MS = 3_000
export const MAX_AUTO_RETRIES = 1

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Monta a query ignorando valores vazios. */
export function buildQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value))
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

/** Aceita só https (ou http em localhost, para desenvolvimento) e devolve a origem sem barra final. */
export function normalizeHost(apiHost) {
  let url
  try {
    url = new URL(String(apiHost || '').trim())
  } catch {
    throw new ApiError(ERROR_KINDS.CONFIG)
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) throw new ApiError(ERROR_KINDS.CONFIG)
  return url.origin
}

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new ApiError(ERROR_KINDS.WAKING, { status: 0 })), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Transporte real: usa o proxy do ZAF. O segredo é substituído pela Zendesk no servidor
 * (`{{setting.api_secret}}` + `secure: true`); ele nunca chega ao navegador.
 */
export function createZafTransport(zafClient, getSettings) {
  return async ({ path, params, dataType }) => {
    const { api_host: apiHost } = await getSettings()
    const url = `${normalizeHost(apiHost)}${API_BASE_PATH}${path}${buildQuery(params)}`
    const options = {
      url,
      type: 'GET',
      secure: true,
      timeout: REQUEST_TIMEOUT_MS,
      headers: { Authorization: 'Bearer {{setting.api_secret}}' }
    }
    if (dataType) options.dataType = dataType
    return zafClient.request(options)
  }
}

function parseBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      throw new ApiError(ERROR_KINDS.UNKNOWN)
    }
  }
  return body
}

/**
 * Cliente da API. `transport({ path, params, dataType })` resolve com o corpo ou rejeita com
 * um erro estilo jqXHR (`status`, `responseJSON`). Trata timeout longo e 1 retry automático
 * quando o servidor está acordando; 401/429/503 não são repetidos.
 */
export function createApiClient({
  transport,
  timeoutMs = REQUEST_TIMEOUT_MS,
  retryDelayMs = RETRY_DELAY_MS,
  maxRetries = MAX_AUTO_RETRIES,
  sleep = defaultSleep
}) {
  async function send(request) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await withTimeout(Promise.resolve(transport(request)), timeoutMs)
      } catch (raw) {
        const error = toApiError(raw)
        if (!error.retryable || attempt >= maxRetries) throw error
        await sleep(retryDelayMs)
      }
    }
  }

  return {
    /** GET que devolve `{ data, meta }` do contrato. */
    async get(path, params) {
      const body = parseBody(await send({ path, params }))
      if (!body || body.success !== true) {
        throw toApiError({ status: 200, responseJSON: body })
      }
      return { data: body.data, meta: body.meta ?? null }
    },
    /** GET de texto puro (CSV). */
    async getText(path, params) {
      const body = await send({ path, params, dataType: 'text' })
      if (typeof body !== 'string') throw new ApiError(ERROR_KINDS.UNKNOWN)
      return body
    }
  }
}
