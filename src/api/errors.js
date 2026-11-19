// Classificação dos erros da API. A mensagem mostrada ao usuário vem do i18n (`errors.<kind>`).
export const ERROR_KINDS = {
  WAKING: 'waking', // servidor dormindo / timeout / sem rede: vale tentar de novo
  UNAUTHORIZED: 'unauthorized',
  RATE_LIMITED: 'rate_limited',
  UNAVAILABLE: 'unavailable',
  CONFIG: 'config',
  BAD_REQUEST: 'bad_request',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown'
}

export class ApiError extends Error {
  constructor(kind, { status = 0, code = null, serverMessage = null } = {}) {
    super(serverMessage || kind)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.code = code
    // Texto curto em português devolvido pelo contrato (`error`), usado só para 400/404.
    this.serverMessage = serverMessage
  }

  /** Só "acordando" é repetido automaticamente. */
  get retryable() {
    return this.kind === ERROR_KINDS.WAKING
  }
}

/**
 * Converte o erro do transporte (objeto no estilo jqXHR do ZAF ou erro do timeout) em ApiError.
 * 502/503/504 sem corpo JSON do contrato = proxy do Render acordando o servidor.
 * 503 com corpo JSON do contrato (SERVICE_UNAVAILABLE) = servidor no ar, mas sem segredo configurado.
 */
export function toApiError(err) {
  if (err instanceof ApiError) return err

  const status = Number(err?.status) || 0
  const body = err?.responseJSON && typeof err.responseJSON === 'object' ? err.responseJSON : null
  const code = body?.code ?? null
  const serverMessage = typeof body?.error === 'string' ? body.error : null
  const info = { status, code, serverMessage }

  if (status === 401) return new ApiError(ERROR_KINDS.UNAUTHORIZED, info)
  if (status === 429) return new ApiError(ERROR_KINDS.RATE_LIMITED, info)
  if (status === 400) return new ApiError(ERROR_KINDS.BAD_REQUEST, info)
  if (status === 404) return new ApiError(ERROR_KINDS.NOT_FOUND, info)
  if (status === 503 && body) return new ApiError(ERROR_KINDS.UNAVAILABLE, info)
  if (status === 502 || status === 503 || status === 504) return new ApiError(ERROR_KINDS.WAKING, info)
  if (status === 0) return new ApiError(ERROR_KINDS.WAKING, info) // timeout ou sem resposta
  return new ApiError(ERROR_KINDS.UNKNOWN, info)
}
