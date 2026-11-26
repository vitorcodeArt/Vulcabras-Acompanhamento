import { describe, expect, it } from 'vitest'
import I18n from '../src/lib/i18n'
import { maskText } from '../src/lib/mask'
import { describeIneligibility, diagnose, metaDetails } from '../src/app/routes/reports/diagnosis'

const i18n = new I18n()
await i18n.loadTranslations('pt')
const t = i18n.t
const label = (group, key) => {
  try {
    return i18n.t(`${group}.${key}`)
  } catch {
    return String(key)
  }
}
const helpers = { t, label }

// A conversa analisada em produção (eventos como a API os devolve; sem dado pessoal)
const HELEN_EVENTS = [
  {
    id: 1,
    ts: '2026-11-23T20:35:49Z',
    source: 'client',
    step: 'start',
    step_label: 'Início',
    event: 'webview_opened',
    meta: null
  },
  {
    id: 5,
    ts: '2026-11-23T20:36:34Z',
    source: 'server',
    step: 'identify',
    step_label: 'Identificação',
    event: 'api_call',
    error_code: null,
    meta: { ok: true, tool: 'prepare_reverse_order', attempt: 1, service: 'troque', http_status: null }
  },
  {
    id: 6,
    ts: '2026-11-23T20:36:34Z',
    source: 'server',
    step: 'identify',
    step_label: 'Identificação',
    event: 'step_completed',
    error_code: null,
    meta: {
      id_kind: 'cpf',
      reasons: 0,
      eligible: false,
      step_mode: null,
      order_hash: '31404cce6f9acada82551427700d31f1',
      existing_reverses: 1,
      ineligibility_code: 'alreadyHaveActiveExchangeRequest contactSAC'
    }
  },
  {
    id: 7,
    ts: '2026-11-23T20:36:37Z',
    source: 'client',
    step: 'identify',
    step_label: 'Identificação',
    event: 'error_shown',
    error_code: null,
    meta: null
  },
  {
    id: 9,
    ts: '2026-11-23T20:36:37Z',
    source: 'client',
    step: 'error',
    step_label: 'Tela final',
    event: 'step_viewed',
    error_code: null,
    meta: null
  }
]

describe('mascaramento no app', () => {
  it('esconde e-mail, link, números longos e códigos opacos; mantém códigos legíveis', () => {
    expect(maskText('alreadyHaveActiveExchangeRequest contactSAC')).toBe('alreadyHaveActiveExchangeRequest contactSAC')
    expect(maskText('CPF 123.456.789-00 de ana@exemplo.com')).toBe('CPF ••• de [e-mail]')
    expect(maskText('pedido 123456789')).toBe('pedido •••')
    expect(maskText('sessão 9b4f1bd19449c3a36b273fa971a3f5e9')).toBe('sessão •••')
    expect(maskText('https://x.exemplo.com/a?t=1')).toBe('[link]')
    expect(maskText(null)).toBeNull()
  })
})

const technical = (finding) => Object.fromEntries(finding.technical.map((l) => [l.id, l.value]))
const SENTENCE =
  'Este processo não pode ser realizado nesta central de trocas. Favor utilizar a central de trocas do Marketplace.'

const refused = (code, shownMeta = null, shownCode = null) => [
  {
    id: 1,
    source: 'server',
    step: 'identify',
    event: 'step_completed',
    meta: { eligible: false, existing_reverses: 0, ineligibility_code: code }
  },
  {
    id: 2,
    source: 'client',
    step: 'identify',
    event: 'error_shown',
    error_code: shownCode,
    error_label: shownCode,
    meta: shownMeta
  }
]

describe('diagnóstico da jornada', () => {
  it('conversa analisada: já existe solicitação em andamento, tratado como informação e não como erro', () => {
    const findings = diagnose({ session_status: 'not_eligible' }, HELEN_EVENTS, helpers)
    expect(findings).toHaveLength(1)
    const [f] = findings
    expect(f).toMatchObject({
      kind: 'active_request',
      tone: 'info',
      title: 'Já tem solicitação em andamento',
      guidance: 'Não é um erro. Acompanhe a solicitação existente ou acione o SAC.',
      message: 'Já existe uma solicitação de troca ativa para o pedido; Orientar o cliente a procurar o SAC'
    })
    expect(technical(f)).toMatchObject({ raw: 'alreadyHaveActiveExchangeRequest contactSAC', existing: '1' })
  })

  it('compra em marketplace: a frase do Troque vira a mensagem, sem se repetir nos detalhes', () => {
    const [f] = diagnose(
      {},
      refused(SENTENCE, { detail: SENTENCE, ineligibility_code: SENTENCE }, 'ORDER_NOT_ELIGIBLE'),
      helpers
    )
    expect(f).toMatchObject({
      kind: 'marketplace',
      tone: 'info',
      title: 'Compra feita em marketplace',
      message: SENTENCE
    })
    expect(f.guidance).toContain('marketplace onde comprou')
    expect(technical(f).raw).toBeUndefined()
  })

  it('orderUnauthorizedSituation (registro antigo, com o código no error_code)', () => {
    const findings = diagnose({}, refused('orderUnauthorizedSituation', null, 'orderUnauthorizedSituation'), helpers)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      kind: 'order_situation',
      tone: 'warning',
      title: 'Situação do pedido não permite troca',
      message: 'A situação do pedido não permite troca ou devolução'
    })
  })

  it('prazo, sem opção e motivo desconhecido', () => {
    expect(diagnose({}, refused('expiredExchangeReturnDeadlines'), helpers)[0].kind).toBe('deadline')
    expect(diagnose({}, refused('codigoNovo'), helpers)[0]).toMatchObject({ kind: 'not_eligible', message: null })
    const noReasons = [{ id: 1, source: 'client', event: 'error_shown', error_code: 'NO_REASONS_FOR_TYPE', meta: null }]
    expect(diagnose({}, noReasons, helpers)[0].kind).toBe('no_reasons')
  })

  it('recusa na hora de enviar: reconhece o motivo pela mensagem', () => {
    const events = [
      { id: 1, source: 'client', event: 'error_shown', error_code: 'ORDER_NOT_ELIGIBLE', meta: { detail: SENTENCE } }
    ]
    expect(diagnose({}, events, helpers)[0]).toMatchObject({ kind: 'marketplace', message: SENTENCE })
  })

  it('falha de integração junta a chamada com o aviso ao cliente', () => {
    const events = [
      {
        id: 1,
        source: 'server',
        step_label: 'Envio da solicitação',
        event: 'api_call',
        error_code: 'TEMPORARY_FAILURE',
        error_label: 'Falha temporária no Troque',
        meta: {
          ok: false,
          tool: 'create_reverse_order',
          attempt: 2,
          http_status: 503,
          upstream_code: 'TEMPORARY_FAILURE'
        }
      },
      {
        id: 2,
        source: 'client',
        event: 'error_shown',
        error_code: 'TEMPORARY_FAILURE',
        meta: { detail: 'Tente em instantes. Pedido 555666777' }
      }
    ]
    const findings = diagnose({ session_status: 'error' }, events, helpers)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      kind: 'integration',
      tone: 'danger',
      title: 'Falha no Troque',
      message: 'Tente em instantes. Pedido •••'
    })
    expect(technical(findings[0])).toMatchObject({
      tool: 'create_reverse_order',
      http: '503',
      attempt: '2',
      type: 'Falha temporária no Troque'
    })
    expect(technical(findings[0]).upstream).toBeUndefined() // igual ao código: não repete
  })

  it('pedido não encontrado e criação não confirmada têm orientação própria', () => {
    const api = (code) => [
      {
        id: 1,
        source: 'server',
        event: 'api_call',
        error_code: code,
        meta: { ok: false, upstream_code: 'erro 12345678900 estranho' }
      }
    ]
    const [notFound] = diagnose({}, api('ORDER_NOT_FOUND'), helpers)
    expect(notFound).toMatchObject({ kind: 'order_not_found', tone: 'warning' })
    expect(technical(notFound).upstream).toBe('erro ••• estranho')
    expect(diagnose({}, api('CREATION_UNCONFIRMED'), helpers)[0].guidance).toContain(
      'Confira se a solicitação foi criada'
    )
  })

  it('erro de tela, atendente, status sem detalhe e jornada sem problema', () => {
    const shown = [{ id: 1, source: 'client', event: 'error_shown', error_code: 'VALIDATION_FAILED', meta: null }]
    expect(diagnose({}, shown, helpers)[0].kind).toBe('screen_error')
    const handoff = [
      { id: 2, source: 'server', event: 'handoff_requested', meta: { reason: 'Solicitação fora do prazo' } }
    ]
    expect(technical(diagnose({}, handoff, helpers)[0]).reason).toBe('Solicitação fora do prazo')
    expect(diagnose({ session_status: 'error' }, [], helpers)[0].kind).toBe('unknown')
    expect(diagnose({ session_status: 'not_eligible' }, [], helpers)[0].kind).toBe('not_eligible')
    expect(diagnose({ session_status: 'completed' }, [], helpers)).toEqual([])
  })
})

describe('detalhes do meta de cada evento', () => {
  it('usa rótulos em português, mascara textos e separa o que não conhece', () => {
    const { rows, other } = metaDetails(
      {
        ok: false,
        tool: 'prepare_reverse_order',
        http_status: 503,
        order_hash: '31404cce6f9acada8255',
        eligible: false,
        id_kind: 'cpf',
        detail: 'pedido 987654321',
        chave_nova: 'valor 11122233344',
        reason: 'não repetir',
        duration_ms: 5,
        vazio: null
      },
      helpers
    )
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]))
    expect(byId.ok).toMatchObject({ label: 'Resultado da chamada', value: 'Falhou' })
    expect(byId.http_status.value).toBe('503')
    expect(byId.order_hash.value).toBe('31404cce…') // só o começo, para comparar pedidos
    expect(byId.eligible.value).toBe('Não')
    expect(byId.id_kind.value).toBe('CPF') // o tipo do documento, nunca o número
    expect(byId.detail.value).toBe('pedido •••')
    expect(other).toEqual([{ id: 'chave_nova', label: 'chave_nova', value: 'valor •••' }])
    expect(rows.find((r) => r.id === 'reason')).toBeUndefined()
    expect(rows.find((r) => r.id === 'duration_ms')).toBeUndefined()
  })

  it('frase do Troque no campo do código fica como veio e não se repete nos detalhes', () => {
    const sentence =
      'Este processo não pode ser realizado nesta central de trocas. Favor utilizar a central de trocas do Marketplace.'
    expect(describeIneligibility(sentence, label)).toEqual({ text: sentence, raw: sentence })
    const { rows } = metaDetails({ detail: sentence, ineligibility_code: sentence }, helpers)
    expect(rows.map((r) => r.id)).toEqual(['detail'])
  })

  it('traduz o código de inelegibilidade quando conhece todas as palavras', () => {
    expect(describeIneligibility('alreadyHaveActiveExchangeRequest contactSAC', label).text).toBe(
      'Já existe uma solicitação de troca ativa para o pedido; Orientar o cliente a procurar o SAC'
    )
    expect(describeIneligibility('codigoNovo', label)).toEqual({ text: 'codigoNovo', raw: 'codigoNovo' })
    expect(describeIneligibility(null, label)).toEqual({ text: '', raw: '' })
  })
})
