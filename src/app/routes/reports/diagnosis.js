import { maskText } from '../../../lib/mask'

// Campos do `meta` que o app sabe explicar. mask: o texto passa por maskText antes de aparecer.
// Chaves fora desta lista aparecem em "Outros detalhes", sempre mascaradas.
const KNOWN_META = {
  eligible: { label: 'eligible', kind: 'bool' },
  existing_reverses: { label: 'existing_reverses' },
  reasons: { label: 'reasons_available' },
  id_kind: { label: 'id_kind', kind: 'upper' },
  step_mode: { label: 'step_mode' },
  order_hash: { label: 'order_hash', kind: 'short' },
  service: { label: 'service', kind: 'title' },
  tool: { label: 'tool' },
  ok: { label: 'ok', kind: 'ok' },
  attempt: { label: 'attempt' },
  http_status: { label: 'http_status' },
  upstream_code: { label: 'upstream_code', mask: true },
  detail: { label: 'detail', mask: true },
  ineligibility_code: { label: 'ineligibility_code', kind: 'ineligibility', mask: true },
  outcome: { label: 'outcome', kind: 'outcome' },
  type: { label: 'type', kind: 'flowType' },
  flow_type: { label: 'type', kind: 'flowType' },
  sub_reason: { label: 'sub_reason', mask: true },
  items: { label: 'items' },
  photos: { label: 'photos' },
  field: { label: 'field' },
  retention_accepted: { label: 'retention_accepted', kind: 'bool' },
  ticket_id: { label: 'ticket_id' },
  category: { label: 'category' },
  product_title: { label: 'product_title' },
  product_id: { label: 'product_id' },
  sku: { label: 'sku' },
  size: { label: 'size' },
  color: { label: 'color' },
  query: { label: 'query', mask: true },
  results_count: { label: 'results_count' }
}

// Já mostrados em outro lugar da linha do tempo
const HIDDEN_META = new Set(['reason', 'duration_ms'])

/**
 * Traduz o código de inelegibilidade só quando TODAS as palavras são códigos conhecidos.
 * O Troque às vezes manda uma frase inteira nesse campo: nesse caso ela fica como veio.
 */
export function describeIneligibility(raw, label) {
  const code = maskText(String(raw ?? ''))
  if (!code) return { text: '', raw: '' }
  const words = code.split(' ')
  const translated = words.map((word) => label('ineligibility', word))
  const allKnown = translated.every((text, i) => text !== words[i])
  return { text: allKnown ? translated.join('; ') : code, raw: code }
}

function formatValue(spec, value, { t, label }) {
  switch (spec?.kind) {
    case 'bool':
      return value ? t('common.yes') : t('common.no')
    case 'ok':
      return value ? t('meta.ok_true') : t('meta.ok_false')
    case 'upper':
      return String(value).toUpperCase()
    case 'short':
      return `${String(value).slice(0, 8)}…`
    case 'title':
      return String(value).charAt(0).toUpperCase() + String(value).slice(1)
    case 'outcome':
      return label('outcomes', value)
    case 'flowType':
      return label('flowTypes', value)
    case 'ineligibility': {
      const { text, raw } = describeIneligibility(value, label)
      return text === raw ? raw : `${text} (${raw})`
    }
    default:
      return spec?.mask ? maskText(String(value)) : String(value)
  }
}

/** Linhas de detalhe de um evento: conhecidas (com rótulo em português) e demais (mascaradas). */
export function metaDetails(meta, helpers) {
  const rows = []
  const other = []
  Object.entries(meta ?? {}).forEach(([key, value]) => {
    if (HIDDEN_META.has(key) || value === null || value === undefined || value === '') return
    // Frase do Troque repetida nos dois campos: mostra uma vez só (em "Detalhe")
    if (key === 'ineligibility_code' && value === meta.detail) return
    const spec = KNOWN_META[key]
    if (spec) {
      rows.push({ id: key, label: helpers.t(`meta.${spec.label}`), value: formatValue(spec, value, helpers) })
    } else {
      other.push({ id: key, label: key, value: maskText(String(value)) })
    }
  })
  return { rows, other }
}

const line = (id, label, value) =>
  value === null || value === undefined || value === '' ? null : { id, label, value: String(value) }

const clean = (value) => (value === null || value === undefined || value === '' ? null : maskText(String(value)))

// Recusas por regra de negócio (não são erro). A ordem importa: a primeira que casar vence.
const REFUSALS = [
  ['active_request', /alreadyHaveActive\w*Request/i],
  ['marketplace', /marketplace/i],
  ['order_situation', /orderUnauthorizedSituation/i],
  ['deadline', /expired\w*Deadline/i]
]
export const INELIGIBLE_ERROR_CODES = ['ORDER_NOT_ELIGIBLE', 'NO_REASONS_FOR_TYPE']

// Cor de cada caso: azul = informativo, amarelo = atenção, vermelho = falha
const TONES = {
  active_request: 'info',
  marketplace: 'info',
  handoff: 'info',
  order_situation: 'warning',
  deadline: 'warning',
  no_reasons: 'warning',
  not_eligible: 'warning',
  order_not_found: 'warning',
  session_expired: 'warning',
  creation_unconfirmed: 'danger',
  integration: 'danger',
  screen_error: 'danger',
  unknown: 'danger'
}

const refusalCase = (...texts) => {
  const text = texts.filter(Boolean).join(' ')
  return REFUSALS.find(([, pattern]) => pattern.test(text))?.[0] ?? 'not_eligible'
}

// Caso de um código de erro (de chamada a serviço ou mostrado ao cliente)
function errorCase(code, fallback) {
  if (code === 'ORDER_NOT_FOUND' || code === 'TOO_MANY_ATTEMPTS') return 'order_not_found'
  if (code === 'CREATION_UNCONFIRMED') return 'creation_unconfirmed'
  if (code === 'SESSION_EXPIRED') return 'session_expired'
  if (code === 'NO_REASONS_FOR_TYPE') return 'no_reasons'
  return fallback
}

/** Mensagem para o atendente: a que o cliente viu; sem ela, a frase que o Troque mandou no lugar do código. */
function customerMessage(detail, ineligibilityCode) {
  if (detail) return clean(detail)
  const raw = clean(ineligibilityCode)
  return raw && raw.split(' ').length > 3 ? raw : null
}

/**
 * Explica a jornada para o atendente, em ordem cronológica. Cada item:
 * { id, kind, tone, title, guidance, message, technical: [{ id, label, value }] }.
 * Junta num só item o que é a mesma causa (consulta/chamada + aviso ao cliente).
 * Devolve [] se não houve nada a explicar.
 */
export function diagnose(item, events, { t, label }) {
  const findings = []
  const make = (id, kind, extra = {}) => ({ id, kind, message: null, technical: [], ...extra })
  const add = (list) => list.filter(Boolean)

  for (const event of events ?? []) {
    const meta = event.meta ?? {}
    const type = event.error_label ?? event.error_code

    if (event.event === 'api_call' && (meta.ok === false || event.error_code)) {
      const upstream = clean(meta.upstream_code)
      findings.push(
        make(`api-${event.id}`, errorCase(event.error_code, 'integration'), {
          source: 'api',
          code: event.error_code,
          technical: add([
            line('type', t('diag.error_type'), type),
            line('tool', t('meta.tool'), meta.tool),
            line('upstream', t('diag.upstream'), upstream && upstream !== event.error_code ? upstream : null),
            line('http', t('meta.http_status'), meta.http_status),
            line('attempt', t('meta.attempt'), meta.attempt),
            line('step', t('diag.step'), event.step_label)
          ])
        })
      )
    } else if (event.event === 'step_completed' && event.source === 'server' && meta.eligible === false) {
      const raw = clean(meta.ineligibility_code)
      findings.push(
        make(`inel-${event.id}`, refusalCase(raw), {
          source: 'eligibility',
          raw,
          message: customerMessage(null, meta.ineligibility_code),
          technical: add([
            line('raw', t('meta.ineligibility_code'), raw),
            line('existing', t('meta.existing_reverses'), meta.existing_reverses)
          ])
        })
      )
    } else if (event.event === 'error_shown') {
      const previous = findings[findings.length - 1]
      const sameCause =
        previous && !previous.merged && (previous.source === 'eligibility' || previous.code === event.error_code)
      const message = customerMessage(meta.detail, meta.ineligibility_code)
      if (sameCause) {
        previous.merged = true
        previous.message = message ?? previous.message
        // A mensagem pode dizer mais que o código (ex.: central do marketplace)
        if (previous.kind === 'not_eligible') previous.kind = refusalCase(previous.raw, message)
      } else {
        const refusal = event.error_code === 'ORDER_NOT_ELIGIBLE'
        const kind = refusal
          ? refusalCase(meta.ineligibility_code, meta.detail)
          : errorCase(event.error_code, 'screen_error')
        findings.push(
          make(`err-${event.id}`, kind, {
            source: 'shown',
            message,
            technical: add([
              line('type', t('diag.error_type'), type),
              line('raw', t('meta.ineligibility_code'), clean(meta.ineligibility_code)),
              line('step', t('diag.step'), event.step_label)
            ])
          })
        )
      }
    } else if (event.event === 'handoff_requested') {
      findings.push(
        make(`handoff-${event.id}`, 'handoff', {
          technical: add([line('reason', t('diag.reason'), meta.reason ?? meta.handoff_reason)])
        })
      )
    }
  }

  if (!findings.length && item?.session_status === 'error') findings.push(make('unknown', 'unknown'))
  if (!findings.length && item?.session_status === 'not_eligible') findings.push(make('refused', 'not_eligible'))

  return findings.map((finding) => {
    // "O Troque mandou uma frase" já aparece como mensagem: não repetir nos detalhes
    const technical = finding.technical.filter((l) => !(l.id === 'raw' && l.value === finding.message))
    // Motivo desconhecido: mostra o código traduzido quando há tradução
    const raw = finding.raw ? describeIneligibility(finding.raw, label) : null
    return {
      id: finding.id,
      kind: finding.kind,
      tone: TONES[finding.kind],
      title: t(`diag.cases.${finding.kind}.title`),
      guidance: t(`diag.cases.${finding.kind}.guidance`),
      message: finding.message ?? (raw && raw.text !== raw.raw ? raw.text : null),
      technical
    }
  })
}
