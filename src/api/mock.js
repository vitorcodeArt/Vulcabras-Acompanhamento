// Modo demonstração: gera dados FICTÍCIOS no formato de docs/api-contract.md.
// Tudo é derivado de um conjunto de envios/sessões gerado com semente fixa, então totais,
// funil, lista e relatórios batem entre si. Nenhum dado real aqui.
import { addDays, dateKey, daysBetween, today } from '../lib/dates'

const BRANDS = ['mizuno', 'olympikus', 'underarmour']
const FLOWS = ['catalog', 'reverse', 'tracking']
const REVERSE_STEPS = [
  'start',
  'identify',
  'items',
  'reasons',
  'address',
  'retention',
  'shipping',
  'refund',
  'summary',
  'result'
]
const CATALOG_STEPS = ['categories', 'products', 'details']

const STEP_LABELS = {
  start: 'Início',
  identify: 'Identificação',
  items: 'Itens',
  reasons: 'Motivo',
  address: 'Endereço',
  retention: 'Vale-compras',
  shipping: 'Envio',
  refund: 'Reembolso',
  summary: 'Resumo',
  result: 'Resultado',
  categories: 'Categorias',
  products: 'Produtos',
  details: 'Detalhe do produto',
  submit: 'Envio da solicitação',
  error: 'Tela de erro'
}
const EVENT_LABELS = {
  webview_opened: 'Abriu a webview',
  step_viewed: 'Viu a etapa',
  step_completed: 'Concluiu a etapa',
  step_back: 'Voltou',
  validation_error: 'Erro de preenchimento',
  error_shown: 'Viu um erro',
  api_call: 'Chamada a serviço',
  photo_added: 'Adicionou foto',
  photo_removed: 'Removeu foto',
  ticket_created: 'Ticket criado',
  reverse_created: 'Solicitação criada',
  completed: 'Concluiu',
  handoff_requested: 'Pediu atendente',
  abandoned: 'Saiu da webview',
  category_selected: 'Escolheu categoria',
  search_performed: 'Pesquisou',
  product_viewed: 'Viu produto',
  variation_selected: 'Escolheu tamanho/cor',
  add_to_cart_clicked: 'Clicou em adicionar ao carrinho'
}
const ERROR_LABELS = {
  TEMPORARY_FAILURE: 'Falha temporária no Troque',
  ORDER_NOT_FOUND: 'Pedido não encontrado',
  ORDER_NOT_ELIGIBLE: 'Pedido não elegível',
  VALIDATION_FAILED: 'Dados inválidos',
  PHOTO_REQUIRED: 'Foto obrigatória',
  PHOTO_UPLOAD_FAILED: 'Falha ao enviar foto',
  SESSION_EXPIRED: 'Sessão expirada',
  RATE_LIMITED: 'Limite de uso'
}
const OUTCOME_LABELS = {
  approved_with_shipping: 'Aprovada, com envio',
  approved_without_shipping: 'Aprovada, sem envio contratado',
  pending_analysis: 'Em análise',
  approved_shipping_failed: 'Aprovada, envio falhou'
}
const HANDOFF_REASONS = [
  'Solicitação fora do prazo',
  'Produto com defeito grave',
  'Pedido de outra loja',
  'Dúvida sobre reembolso'
]
const REASONS = ['Defeito', 'Tamanho errado', 'Não gostei', 'Produto diferente do anunciado', 'Arrependimento']
const CATEGORIES = ['Calçados', 'Roupas', 'Acessórios', 'Esportes']
const SEARCH_TERMS = ['tenis corrida', 'camiseta treino', 'mochila', 'meia', 'bermuda', 'chinelo']
const SIZES = ['38', '39', '40', '41', '42', 'P', 'M', 'G']
const COLORS = ['Preto', 'Branco', 'Azul', 'Cinza']
const FIRST_NAMES = ['Maria', 'João', 'Ana', 'Pedro', 'Carla', 'Lucas', 'Bruna', 'Rafael', 'Julia', 'Tiago']
const INITIALS = 'ABCDEFGHJKLMNPRSTV'
const PRODUCTS = Array.from({ length: 12 }, (_, i) => ({
  product_id: String(1001 + i),
  title: `Produto Demo ${String.fromCharCode(65 + i)}`
}))

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- geração ----------

function build() {
  const rand = mulberry32(20261119)
  const pick = (list) => list[Math.floor(rand() * list.length)]
  const between = (min, max) => min + Math.floor(rand() * (max - min + 1))
  const now = Date.now()
  const rows = []

  for (let i = 0; i < 320; i += 1) {
    const flowRoll = rand()
    const flow = flowRoll < 0.4 ? 'reverse' : flowRoll < 0.8 ? 'catalog' : 'tracking'
    const sentAt = now - Math.floor(rand() * rand() * 30 * 86400000) - 60000
    const send = {
      send_id: `demo-send-${String(i).padStart(4, '0')}`,
      sent_at: new Date(sentAt).toISOString(),
      conversation_id: `demo${(100000 + i * 7919).toString(36)}`,
      customer_name: `${pick(FIRST_NAMES)} ${pick([...INITIALS])}.`,
      brand: pick(BRANDS),
      flow,
      ok: rand() > 0.03
    }
    const row = { send, session: null, events: [], order: String(1000000 + i * 37) }
    if (send.ok && rand() < 0.62) {
      row.session = { session_id: `demo-session-${String(i).padStart(4, '0')}` }
      row.events = genEvents(row, { rand, pick, between, now, sentAt })
      finalizeSession(row, now)
    }
    rows.push(row)
  }
  rows.sort((a, b) => (a.send.sent_at < b.send.sent_at ? 1 : -1))
  return rows
}

function genEvents(row, { rand, pick, between, now, sentAt }) {
  const { flow } = row.send
  let t = sentAt + between(20, 600) * 1000
  const events = []
  let id = 0
  const push = (event, step, extra = {}) => {
    id += 1
    events.push({
      id,
      ts: new Date(t).toISOString(),
      source: 'client',
      step: step ?? null,
      event,
      duration_ms: null,
      error_code: null,
      meta: {},
      ...extra
    })
  }
  const tick = (min, max) => {
    t += between(min, max) * 1000
  }
  const fresh = now - sentAt < 20 * 60000

  if (flow === 'tracking') {
    push('webview_opened', 'start')
    return events
  }

  if (flow === 'catalog') {
    push('webview_opened', 'categories')
    push('step_viewed', 'categories')
    const depth = rand() < 0.85 ? (rand() < 0.7 ? (rand() < 0.45 ? 3 : 2) : 1) : 0
    if (rand() < 0.4) {
      tick(5, 30)
      const term = pick(SEARCH_TERMS)
      push('search_performed', 'categories', {
        meta: { query: term, results_count: rand() < 0.14 ? 0 : between(1, 30) }
      })
    }
    if (depth >= 1) {
      tick(5, 40)
      push('category_selected', 'categories', { meta: { category: pick(CATEGORIES) }, duration_ms: null })
      push('step_completed', 'categories', { duration_ms: between(5, 60) * 1000 })
      push('step_viewed', 'products')
    }
    if (depth >= 2) {
      tick(10, 60)
      push('step_completed', 'products', { duration_ms: between(10, 90) * 1000 })
      const product = pick(PRODUCTS)
      push('step_viewed', 'details')
      push('product_viewed', 'details', { meta: { product_id: product.product_id, product_title: product.title } })
      tick(5, 30)
      push('variation_selected', 'details', {
        meta: { sku: `${product.product_id}-${between(1, 9)}`, size: pick(SIZES), color: pick(COLORS) }
      })
      if (depth >= 3) {
        tick(3, 25)
        push('add_to_cart_clicked', 'details', {
          meta: { sku: `${product.product_id}-${between(1, 9)}`, product_id: product.product_id }
        })
      }
    }
    if (!events.some((e) => e.event === 'add_to_cart_clicked') && !fresh) {
      tick(60, 1800)
      push('abandoned', null)
    }
    return events
  }

  // reverse
  push('webview_opened', 'start')
  const roll = rand()
  const end =
    roll < 0.3 ? 'completed' : roll < 0.45 ? 'handoff' : roll < 0.6 ? 'error' : fresh ? 'in_progress' : 'abandoned'
  // Erros: pedido não elegível (termina na identificação), falha da integração ou erro simples
  const errorKind = end === 'error' ? pick(['ineligible', 'integration', 'plain']) : null
  const lastIndex =
    end === 'completed'
      ? REVERSE_STEPS.length - 1
      : errorKind === 'ineligible'
        ? 1
        : between(1, REVERSE_STEPS.length - 2)
  let retentionOffered = false
  for (let i = 0; i <= lastIndex; i += 1) {
    const step = REVERSE_STEPS[i]
    tick(3, 20)
    push('step_viewed', step)
    if (step === 'identify') {
      const ineligible = errorKind === 'ineligible'
      push('api_call', step, {
        source: 'server',
        duration_ms: between(1500, 3500),
        meta: { service: 'troque', tool: 'prepare_reverse_order', ok: true, attempt: 1, http_status: null }
      })
      if (ineligible) {
        push('step_completed', step, {
          source: 'server',
          meta: {
            id_kind: 'cpf',
            reasons: 0,
            eligible: false,
            order_hash: `demo${between(100000, 999999)}abcdef0123456789`,
            existing_reverses: 1,
            ineligibility_code: 'alreadyHaveActiveExchangeRequest contactSAC'
          }
        })
      }
    }
    if (step === 'retention') retentionOffered = true
    if (step === 'reasons') {
      push('step_completed', step, { duration_ms: between(8, 70) * 1000, meta: { reason: pick(REASONS) } })
      if (rand() < 0.4) push('photo_added', step, { meta: { count: between(1, 3) } })
    } else if (i < lastIndex || end === 'completed') {
      if (i < REVERSE_STEPS.length - 1) push('step_completed', step, { duration_ms: between(6, 90) * 1000 })
    }
  }
  tick(2, 10)
  if (end === 'handoff')
    push('handoff_requested', REVERSE_STEPS[lastIndex], { source: 'server', meta: { reason: pick(HANDOFF_REASONS) } })
  if (errorKind === 'ineligible') {
    push('error_shown', 'identify', {
      error_code: 'ORDER_NOT_ELIGIBLE',
      meta: {
        ineligibility_code: 'alreadyHaveActiveExchangeRequest contactSAC',
        detail: 'Este pedido já possui uma solicitação de troca ativa. Fale com o SAC.'
      }
    })
    push('step_completed', 'identify', { duration_ms: between(20, 60) * 1000 })
    push('step_viewed', 'error')
  } else if (errorKind === 'integration') {
    const step = REVERSE_STEPS[lastIndex]
    push('api_call', step, {
      source: 'server',
      duration_ms: between(8000, 30000),
      error_code: 'TEMPORARY_FAILURE',
      meta: {
        service: 'troque',
        tool: 'create_reverse_order',
        ok: false,
        attempt: 2,
        http_status: 503,
        upstream_code: 'TEMPORARY_FAILURE'
      }
    })
    push('error_shown', step, {
      error_code: 'TEMPORARY_FAILURE',
      meta: { detail: 'Falha temporária no serviço. Tente novamente em instantes.' }
    })
    push('step_viewed', 'error')
  } else if (errorKind === 'plain') {
    push('error_shown', REVERSE_STEPS[lastIndex], { error_code: pick(Object.keys(ERROR_LABELS)) })
  }
  if (end === 'abandoned') {
    tick(60, 1800)
    push('abandoned', null)
  }
  if (end === 'completed') {
    const outcome = pick(Object.keys(OUTCOME_LABELS))
    const type = rand() < 0.6 ? 'troca' : 'devolucao'
    const ticketId = 900000 + between(1, 99999)
    push('ticket_created', 'submit', { source: 'server', meta: { ticket_id: ticketId, photos: between(0, 3) } })
    push('reverse_created', 'submit', {
      source: 'server',
      meta: { outcome, type, ticket_id: ticketId, retention_accepted: retentionOffered ? rand() < 0.43 : false }
    })
    push('completed', 'submit', { source: 'server', meta: { outcome } })
  }
  return events
}

function finalizeSession(row, now) {
  const { send, events } = row
  const last = events[events.length - 1]
  const has = (name) => events.some((e) => e.event === name)
  let status
  if (send.flow === 'tracking') status = 'completed'
  else if (has('completed') || has('add_to_cart_clicked')) status = 'completed'
  else if (has('handoff_requested')) status = 'handoff'
  else if (last.event === 'error_shown' || last.step === 'error') status = 'error'
  else if (last.event === 'abandoned' || now - new Date(last.ts).getTime() > 30 * 60000) status = 'abandoned'
  else status = 'in_progress'
  row.session.status = status
}

let ROWS = null
const rows = () => (ROWS ??= build())

// ---------- projeções no formato do contrato ----------

function metaOf(row, event) {
  return row.events.find((e) => e.event === event)?.meta ?? null
}

function toItem(row) {
  const { send, session, events } = row
  const created = metaOf(row, 'reverse_created')
  const reasonMeta = events.find((e) => e.event === 'step_completed' && e.step === 'reasons')?.meta
  const last = events[events.length - 1]
  const first = events[0]
  const isReverse = send.flow === 'reverse'
  const outcome = created?.outcome ?? null
  const clickStatus = !send.ok ? 'send_failed' : session ? 'clicked' : 'not_clicked'
  return {
    send_id: send.send_id,
    sent_at: send.sent_at,
    conversation_id: send.conversation_id,
    customer_name: send.customer_name,
    brand: send.brand,
    flow: send.flow,
    click_status: clickStatus,
    session_id: session?.session_id ?? null,
    session_status: session?.status ?? null,
    last_step: last?.step ?? (session ? 'start' : null),
    last_event_at: last?.ts ?? null,
    duration_seconds: last && first ? Math.round((new Date(last.ts) - new Date(first.ts)) / 1000) : null,
    outcome,
    outcome_label: outcome ? OUTCOME_LABELS[outcome] : null,
    request_type: isReverse ? (created?.type ?? null) : null,
    reason: isReverse ? (reasonMeta?.reason ?? null) : null,
    ticket_id: isReverse ? (created?.ticket_id ?? null) : null,
    error_count: events.filter((e) => e.event === 'error_shown').length,
    products_viewed: events.filter((e) => e.event === 'product_viewed').length,
    cart_clicks: events.filter((e) => e.event === 'add_to_cart_clicked').length
  }
}

function toEvent(e) {
  return {
    id: e.id,
    ts: e.ts,
    source: e.source,
    step: e.step,
    step_label: e.step ? (STEP_LABELS[e.step] ?? e.step) : null,
    event: e.event,
    event_label: EVENT_LABELS[e.event] ?? e.event,
    duration_ms: e.duration_ms,
    error_code: e.error_code,
    error_label: e.error_code ? (ERROR_LABELS[e.error_code] ?? e.error_code) : null,
    meta: e.meta
  }
}

// ---------- parâmetros e filtros ----------

function fail(status, code, error) {
  return { status, responseJSON: { success: false, code, error } }
}

function readRange(params) {
  const to = params.to || today()
  const from = params.from || addDays(to, -6)
  const valid = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k)
  if (!valid(from) || !valid(to) || from > to) throw fail(400, 'BAD_REQUEST', 'Período inválido.')
  if (daysBetween(from, to) > 366) throw fail(400, 'BAD_REQUEST', 'O período máximo é de 366 dias.')
  return { from, to }
}

function selectRows(params, { useFlow = true } = {}) {
  const { from, to } = readRange(params)
  if (params.brand && !BRANDS.includes(params.brand)) throw fail(400, 'BAD_REQUEST', 'Marca inválida.')
  if (params.flow && !FLOWS.includes(params.flow)) throw fail(400, 'BAD_REQUEST', 'Fluxo inválido.')
  const selected = rows().filter((row) => {
    const day = dateKey(row.send.sent_at)
    return (
      day >= from &&
      day <= to &&
      (!params.brand || row.send.brand === params.brand) &&
      (!useFlow || !params.flow || row.send.flow === params.flow)
    )
  })
  return { selected, from, to }
}

const meta = (from, to) => ({ generated_at: new Date().toISOString(), from, to, timezone: 'America/Sao_Paulo' })
const rate = (n, d) => (d === 0 ? null : Math.round((n / d) * 1000) / 1000)
const count = (list) => list.length
const top = (map, limit = 20) => {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1])
  const head = sorted.slice(0, limit).map(([key, n]) => ({ key, count: n }))
  const rest = sorted.slice(limit).reduce((sum, [, n]) => sum + n, 0)
  return rest ? [...head, { key: 'outros', count: rest }] : head
}
const tally = (list, fn) => {
  const map = new Map()
  list.forEach((x) => {
    const k = fn(x)
    if (k != null) map.set(k, (map.get(k) ?? 0) + 1)
  })
  return map
}
const hasEvent = (row, name) => row.events.some((e) => e.event === name)

function totalsOf(list) {
  const sends = count(list)
  const failed = list.filter((r) => !r.send.ok).length
  const clicked = list.filter((r) => r.session).length
  const completed = list.filter((r) => r.session?.status === 'completed').length
  const okSends = sends - failed
  const durations = list.filter((r) => r.session).map((r) => toItem(r).duration_seconds)
  return {
    sends,
    send_failed: failed,
    clicked,
    not_clicked: okSends - clicked,
    click_rate: rate(clicked, okSends),
    completed,
    completion_rate_of_clicked: rate(completed, clicked),
    completion_rate_of_sent: rate(completed, okSends),
    handoff: list.filter((r) => r.session?.status === 'handoff').length,
    errors: list.filter((r) => hasEvent(r, 'error_shown')).length,
    avg_duration_seconds: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null
  }
}

// ---------- endpoints ----------

function summary(params) {
  const { selected, from, to } = selectRows(params)
  const days = new Map()
  for (let d = from; d <= to; d = addDays(d, 1)) days.set(d, { date: d, sends: 0, clicked: 0, completed: 0 })
  selected.forEach((r) => {
    const day = days.get(dateKey(r.send.sent_at))
    day.sends += 1
    if (r.session) day.clicked += 1
    if (r.session?.status === 'completed') day.completed += 1
  })
  const group = (keys, field) =>
    keys
      .map((key) => ({ [field]: key, ...totalsOf(selected.filter((r) => r.send[field] === key)) }))
      .filter((g) => g.sends > 0)
  return {
    data: {
      totals: totalsOf(selected),
      by_flow: group(FLOWS, 'flow'),
      by_brand: group(BRANDS, 'brand'),
      daily: [...days.values()]
    },
    meta: meta(from, to)
  }
}

function funnel(params) {
  if (params.flow !== 'reverse' && params.flow !== 'catalog')
    throw fail(400, 'BAD_REQUEST', 'Informe o fluxo: reverse ou catalog.')
  const { selected, from, to } = selectRows(params)
  const sent = selected.filter((r) => r.send.ok)
  const sessions = sent.filter((r) => r.session)
  const stepKeys = params.flow === 'reverse' ? REVERSE_STEPS.slice(1) : CATALOG_STEPS.slice(1)
  const steps = [
    { key: 'sent', label: 'Enviados', sessions: sent.length },
    { key: 'opened', label: 'Abriram', sessions: sessions.length },
    ...stepKeys.map((key) => {
      const reached = sessions.filter((r) => r.events.some((e) => e.event === 'step_viewed' && e.step === key))
      const durations = reached.flatMap((r) =>
        r.events.filter((e) => e.event === 'step_completed' && e.step === key).map((e) => e.duration_ms)
      )
      return {
        key,
        label: STEP_LABELS[key],
        sessions: reached.length,
        avg_duration_ms: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null
      }
    }),
    { key: 'completed', label: 'Concluíram', sessions: sessions.filter((r) => r.session.status === 'completed').length }
  ]
  steps.forEach((step, i) => {
    step.drop_off_rate = i === 0 ? null : rate(steps[i - 1].sessions - step.sessions, steps[i - 1].sessions)
  })
  return { data: { flow: params.flow, steps }, meta: meta(from, to) }
}

function sendsList(params) {
  const { selected, from, to } = selectRows(params)
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 50))
  const q = (params.q || '').trim().toLowerCase()
  if (q && q.length < 3) throw fail(400, 'BAD_REQUEST', 'A busca precisa de pelo menos 3 caracteres.')
  const filtered = selected.filter((row) => {
    const item = toItem(row)
    if (params.click_status && item.click_status !== params.click_status) return false
    if (params.status && item.session_status !== params.status) return false
    if (
      q &&
      !(
        row.send.conversation_id.toLowerCase() === q ||
        row.order === q ||
        row.send.customer_name.toLowerCase().includes(q)
      )
    )
      return false
    return true
  })
  let offset = 0
  if (params.cursor) {
    offset = Number(String(params.cursor).replace('demo-cursor-', ''))
    if (!Number.isInteger(offset) || offset < 0) throw fail(400, 'BAD_REQUEST', 'Cursor inválido.')
  }
  const page = filtered.slice(offset, offset + limit)
  const next = offset + limit < filtered.length ? `demo-cursor-${offset + limit}` : null
  return { data: { items: page.map(toItem), next_cursor: next }, meta: meta(from, to) }
}

function sendDetail(sendId) {
  const row = rows().find((r) => r.send.send_id === sendId)
  if (!row) throw fail(404, 'NOT_FOUND', 'Envio não encontrado.')
  return {
    data: {
      ...toItem(row),
      ...(row.send.flow === 'reverse' && row.session
        ? {
            order_number: row.order,
            items: [
              {
                title: 'Tênis de Treino Demo Preto',
                sku: `${row.order.slice(-6)}-001-37`,
                size: '37',
                image_url: null
              }
            ]
          }
        : {}),
      events: row.events.map(toEvent)
    },
    meta: meta(dateKey(row.send.sent_at), dateKey(row.send.sent_at))
  }
}

function sessionDetail(sessionId) {
  const row = rows().find((r) => r.session?.session_id === sessionId)
  if (!row) throw fail(404, 'NOT_FOUND', 'Sessão não encontrada.')
  const item = toItem(row)
  return {
    data: {
      session: {
        session_id: sessionId,
        send_id: row.send.send_id,
        flow: row.send.flow,
        brand: row.send.brand,
        status: row.session.status
      },
      send: item,
      events: row.events.map(toEvent)
    },
    meta: meta(dateKey(row.send.sent_at), dateKey(row.send.sent_at))
  }
}

function reverseReport(params) {
  const { selected, from, to } = selectRows({ ...params, flow: 'reverse' })
  const sessions = selected.filter((r) => r.session)
  const done = sessions.filter((r) => r.session.status === 'completed')
  const doneSeconds = done.map((r) => toItem(r).duration_seconds).sort((a, b) => a - b)
  const offered = sessions.filter((r) => r.events.some((e) => e.event === 'step_viewed' && e.step === 'retention'))
  const accepted = offered.filter((r) => metaOf(r, 'reverse_created')?.retention_accepted)
  const labeled = (map, labels) => top(map).map((x) => ({ ...x, label: labels[x.key] ?? x.key }))
  return {
    data: {
      totals: {
        sessions: sessions.length,
        completed: done.length,
        handoff: sessions.filter((r) => r.session.status === 'handoff').length,
        errors: sessions.filter((r) => hasEvent(r, 'error_shown')).length,
        avg_seconds_to_complete: doneSeconds.length
          ? Math.round(doneSeconds.reduce((a, b) => a + b, 0) / doneSeconds.length)
          : null,
        p90_seconds_to_complete: doneSeconds.length
          ? doneSeconds[Math.min(doneSeconds.length - 1, Math.floor(doneSeconds.length * 0.9))]
          : null
      },
      by_type: top(tally(done, (r) => metaOf(r, 'reverse_created')?.type)),
      by_reason: top(
        tally(sessions, (r) => r.events.find((e) => e.event === 'step_completed' && e.step === 'reasons')?.meta.reason)
      ),
      by_outcome: labeled(
        tally(done, (r) => metaOf(r, 'reverse_created')?.outcome),
        OUTCOME_LABELS
      ),
      retention: {
        offered: offered.length,
        accepted: accepted.length,
        accept_rate: rate(accepted.length, offered.length)
      },
      photos: { sessions_with_photos: sessions.filter((r) => hasEvent(r, 'photo_added')).length },
      handoff_by_reason: top(tally(sessions, (r) => metaOf(r, 'handoff_requested')?.reason)),
      errors_by_code: labeled(
        tally(sessions, (r) => r.events.find((e) => e.event === 'error_shown')?.error_code),
        ERROR_LABELS
      ),
      by_brand: BRANDS.map((key) => {
        const own = sessions.filter((r) => r.send.brand === key)
        return { key, sessions: own.length, completed: own.filter((r) => r.session.status === 'completed').length }
      }).filter((b) => b.sessions > 0)
    },
    meta: meta(from, to)
  }
}

function catalogReport(params) {
  const { selected, from, to } = selectRows({ ...params, flow: 'catalog' })
  const sessions = selected.filter((r) => r.session)
  const all = (name) => sessions.flatMap((r) => r.events.filter((e) => e.event === name))
  const withView = sessions.filter((r) => hasEvent(r, 'product_viewed'))
  const withCart = sessions.filter((r) => hasEvent(r, 'add_to_cart_clicked'))
  const productMap = new Map()
  all('product_viewed').forEach((e) => {
    const p = productMap.get(e.meta.product_id) ?? {
      product_id: e.meta.product_id,
      title: e.meta.product_title,
      views: 0,
      cart_clicks: 0
    }
    p.views += 1
    productMap.set(e.meta.product_id, p)
  })
  all('add_to_cart_clicked').forEach((e) => {
    const p = productMap.get(e.meta.product_id)
    if (p) p.cart_clicks += 1
  })
  const variations = new Map()
  all('variation_selected').forEach((e) => {
    const k = `${e.meta.size}|${e.meta.color}`
    variations.set(k, (variations.get(k) ?? 0) + 1)
  })
  const searches = all('search_performed')
  const terms = new Map()
  searches.forEach((e) => {
    const t = terms.get(e.meta.query) ?? { term: e.meta.query, count: 0, no_results_count: 0 }
    t.count += 1
    if (e.meta.results_count === 0) t.no_results_count += 1
    terms.set(e.meta.query, t)
  })
  return {
    data: {
      totals: {
        sessions: sessions.length,
        with_product_view: withView.length,
        with_cart_click: withCart.length,
        cart_rate: rate(withCart.length, sessions.length)
      },
      top_categories: top(
        tally(all('category_selected'), (e) => e.meta.category),
        10
      ),
      top_products: [...productMap.values()].sort((a, b) => b.views - a.views).slice(0, 10),
      top_variations: [...variations.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k, n]) => {
          const [size, color] = k.split('|')
          return { size, color, count: n }
        }),
      searches: {
        total: searches.length,
        no_results: searches.filter((e) => e.meta.results_count === 0).length,
        top_terms: [...terms.values()].sort((a, b) => b.count - a.count).slice(0, 10)
      },
      by_brand: BRANDS.map((key) => {
        const own = sessions.filter((r) => r.send.brand === key)
        return {
          key,
          sessions: own.length,
          with_cart_click: own.filter((r) => hasEvent(r, 'add_to_cart_clicked')).length
        }
      }).filter((b) => b.sessions > 0)
    },
    meta: meta(from, to)
  }
}

// CSV: UTF-8 com BOM, separador `;`, proteção contra injeção de fórmula (apóstrofo).
const csvCell = (value) => {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
const csv = (header, lines) => `\uFEFF${[header, ...lines].map((l) => l.map(csvCell).join(';')).join('\n')}\n`

function exportCsv(params) {
  const report = params.report
  if (report === 'sends') {
    const { selected } = selectRows(params)
    return csv(
      [
        'Data/hora',
        'ID da conversa',
        'Cliente',
        'Marca',
        'Fluxo',
        'Status do clique',
        'Situação',
        'Última etapa',
        'Resultado',
        'Ticket'
      ],
      selected.map((r) => {
        const i = toItem(r)
        return [
          i.sent_at,
          i.conversation_id,
          i.customer_name,
          i.brand,
          i.flow,
          i.click_status,
          i.session_status,
          i.last_step,
          i.outcome_label,
          i.ticket_id
        ]
      })
    )
  }
  if (report === 'reverse_sessions') {
    const { selected } = selectRows({ ...params, flow: 'reverse' })
    return csv(
      ['Data/hora', 'ID da conversa', 'Marca', 'Situação', 'Tipo', 'Motivo', 'Resultado', 'Ticket', 'Erros'],
      selected
        .filter((r) => r.session)
        .map((r) => {
          const i = toItem(r)
          return [
            i.sent_at,
            i.conversation_id,
            i.brand,
            i.session_status,
            i.request_type,
            i.reason,
            i.outcome_label,
            i.ticket_id,
            i.error_count
          ]
        })
    )
  }
  if (report === 'catalog_products') {
    const data = catalogReport(params).data
    return csv(
      ['Produto', 'Título', 'Visualizações', 'Cliques em adicionar ao carrinho'],
      data.top_products.map((p) => [p.product_id, p.title, p.views, p.cart_clicks])
    )
  }
  throw fail(400, 'BAD_REQUEST', 'Relatório inválido.')
}

// ---------- falhas simuladas (?mock_error=wake|401|429|503|timeout) ----------

let wakeFailures = 0
function simulatedFailure() {
  const mode = new URLSearchParams(globalThis.location?.search ?? '').get('mock_error')
  if (!mode) return null
  if (mode === 'wake') {
    wakeFailures += 1
    // Falha na tentativa inicial e no retry automático; a próxima (botão) funciona.
    return wakeFailures <= 2 ? { status: 503, responseText: '<html>starting</html>' } : null
  }
  if (mode === 'timeout') return { status: 0, statusText: 'timeout' }
  if (['401', '429', '503'].includes(mode)) {
    const map = {
      401: ['UNAUTHORIZED', 'Não autorizado.'],
      429: ['RATE_LIMITED', 'Muitas requisições.'],
      503: ['SERVICE_UNAVAILABLE', 'Serviço indisponível.']
    }
    return fail(Number(mode), ...map[mode])
  }
  return null
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 280))

/** Transporte do modo demonstração: mesmo contrato do transporte real (corpo ou erro estilo jqXHR). */
export async function mockTransport({ path, params = {} }) {
  await delay()
  const failure = simulatedFailure()
  if (failure) throw failure

  if (path === '/export.csv') return exportCsv(params)
  let result
  if (path === '/health') result = { data: { db: 'ok', ms: 12 }, meta: meta(today(), today()) }
  else if (path === '/summary') result = summary(params)
  else if (path === '/funnel') result = funnel(params)
  else if (path === '/sends') result = sendsList(params)
  else if (path.startsWith('/sends/')) result = sendDetail(decodeURIComponent(path.slice(7)))
  else if (path.startsWith('/sessions/')) result = sessionDetail(decodeURIComponent(path.slice(10)))
  else if (path === '/reports/reverse') result = reverseReport(params)
  else if (path === '/reports/catalog') result = catalogReport(params)
  else throw fail(404, 'NOT_FOUND', 'Rota não encontrada.')

  return { success: true, ...result }
}

export const __testing = { rows }
