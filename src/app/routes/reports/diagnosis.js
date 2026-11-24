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

/** Traduz cada palavra do código de inelegibilidade que o app conhece; o resto fica como veio. */
export function describeIneligibility(raw, label) {
  const code = maskText(String(raw ?? ''))
  if (!code) return { text: '', raw: '' }
  const words = code.split(' ').map((word) => label('ineligibility', word))
  return { text: words.join('; '), raw: code }
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

/**
 * O que o sistema registrou sobre o erro da jornada, em ordem cronológica.
 * Une "pedido não elegível" (servidor) com o erro mostrado ao cliente quando são a mesma causa.
 * Devolve [] se a jornada não teve nada a explicar.
 */
export function diagnose(item, events, { t, label }) {
  const findings = []

  for (const event of events ?? []) {
    const meta = event.meta ?? {}

    if (event.event === 'api_call' && (meta.ok === false || event.error_code)) {
      const errorType = event.error_label ?? event.error_code
      const upstream = meta.upstream_code ? maskText(String(meta.upstream_code)) : null
      findings.push({
        id: `api-${event.id}`,
        tone: 'danger',
        title: t('diag.integration_failed', { tool: meta.tool ? String(meta.tool) : t('diag.service') }),
        lines: [
          line('type', t('diag.error_type'), errorType),
          line('upstream', t('diag.upstream'), upstream && upstream !== event.error_code ? upstream : null),
          line('http', t('meta.http_status'), meta.http_status),
          line('attempt', t('meta.attempt'), meta.attempt),
          line('step', t('diag.step'), event.step_label)
        ].filter(Boolean)
      })
    } else if (event.event === 'step_completed' && event.source === 'server' && meta.eligible === false) {
      const { text, raw } = describeIneligibility(meta.ineligibility_code, label)
      findings.push({
        id: `inel-${event.id}`,
        tone: 'warning',
        title: t('diag.ineligible'),
        lines: [
          line('reason', t('diag.reason'), text),
          line('raw', t('meta.ineligibility_code'), raw && raw !== text ? raw : null),
          line('existing', t('meta.existing_reverses'), meta.existing_reverses)
        ].filter(Boolean)
      })
    } else if (event.event === 'error_shown') {
      const previous = findings[findings.length - 1]
      const message = meta.detail ? maskText(String(meta.detail)) : null
      const type = event.error_label ?? event.error_code
      if (previous?.id.startsWith('inel-') && !previous.merged) {
        // Mesma causa: acrescenta o que o cliente viu ao diagnóstico de inelegibilidade
        previous.merged = true
        const extra = [
          line('shown', t('diag.shown_to_customer'), message),
          line('type', t('diag.error_type'), type)
        ].filter(Boolean)
        previous.lines.push(...extra)
      } else {
        findings.push({
          id: `err-${event.id}`,
          tone: 'danger',
          title: t('diag.error_shown'),
          lines: [
            line('type', t('diag.error_type'), type),
            line('shown', t('diag.shown_to_customer'), message),
            line('step', t('diag.step'), event.step_label)
          ].filter(Boolean)
        })
      }
    } else if (event.event === 'handoff_requested') {
      findings.push({
        id: `handoff-${event.id}`,
        tone: 'warning',
        title: t('diag.handoff'),
        lines: [line('reason', t('diag.reason'), meta.reason ?? meta.handoff_reason)].filter(Boolean)
      })
    }
  }

  if (!findings.length && item?.session_status === 'error') {
    findings.push({ id: 'unknown', tone: 'danger', title: t('diag.unknown'), lines: [] })
  }
  return findings
}
