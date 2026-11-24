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
    step_label: 'Tela de erro',
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

describe('diagnóstico da jornada', () => {
  it('conversa real: pedido não elegível porque já existe troca ativa', () => {
    const findings = diagnose({ session_status: 'error' }, HELEN_EVENTS, helpers)
    expect(findings).toHaveLength(1)
    const [f] = findings
    expect(f.title).toBe('Pedido não elegível para troca ou devolução')
    const lines = Object.fromEntries(f.lines.map((l) => [l.id, l.value]))
    expect(lines.reason).toBe(
      'Já existe uma solicitação de troca ativa para o pedido; Orientar o cliente a procurar o SAC'
    )
    expect(lines.raw).toBe('alreadyHaveActiveExchangeRequest contactSAC')
    expect(lines.existing).toBe('1')
  })

  it('une a inelegibilidade com o que o cliente viu, quando o erro traz a mensagem', () => {
    const events = HELEN_EVENTS.map((e) =>
      e.event === 'error_shown'
        ? {
            ...e,
            error_code: 'ORDER_NOT_ELIGIBLE',
            error_label: 'Pedido não elegível',
            meta: { detail: 'Pedido 555666777 já tem solicitação' }
          }
        : e
    )
    const findings = diagnose({ session_status: 'error' }, events, helpers)
    expect(findings).toHaveLength(1)
    const lines = Object.fromEntries(findings[0].lines.map((l) => [l.id, l.value]))
    expect(lines.shown).toBe('Pedido ••• já tem solicitação')
    expect(lines.type).toBe('Pedido não elegível')
  })

  it('falha de integração mostra ferramenta, retorno, status HTTP e tentativas', () => {
    const events = [
      {
        id: 1,
        source: 'server',
        step: 'submit',
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
      }
    ]
    const [f] = diagnose({ session_status: 'error' }, events, helpers)
    expect(f.title).toBe('Falha na integração: create_reverse_order')
    const lines = Object.fromEntries(f.lines.map((l) => [l.id, l.value]))
    expect(lines.type).toBe('Falha temporária no Troque')
    expect(lines.http).toBe('503')
    expect(lines.attempt).toBe('2')
    expect(lines.upstream).toBeUndefined() // igual ao tipo: não repete
  })

  it('retorno bruto da integração diferente do tipo aparece, sempre mascarado', () => {
    const events = [
      {
        id: 1,
        source: 'server',
        event: 'api_call',
        error_code: 'UNKNOWN_ERROR',
        error_label: 'Erro com código não reconhecido',
        meta: { ok: false, tool: 'x', upstream_code: 'erro 12345678900 estranho' }
      }
    ]
    const [f] = diagnose({}, events, helpers)
    expect(f.lines.find((l) => l.id === 'upstream').value).toBe('erro ••• estranho')
  })

  it('erro simples, atendente e erro sem nenhum detalhe', () => {
    const shown = [
      {
        id: 1,
        source: 'client',
        step_label: 'Endereço',
        event: 'error_shown',
        error_code: 'SESSION_EXPIRED',
        error_label: 'Sessão expirada',
        meta: null
      }
    ]
    expect(diagnose({}, shown, helpers)[0].title).toBe('Erro exibido ao cliente')
    const handoff = [
      { id: 2, source: 'server', event: 'handoff_requested', meta: { reason: 'Solicitação fora do prazo' } }
    ]
    expect(diagnose({}, handoff, helpers)[0].lines[0].value).toBe('Solicitação fora do prazo')
    expect(diagnose({ session_status: 'error' }, [], helpers)[0].title).toBe(
      'A jornada terminou com erro, mas nenhum detalhe foi registrado.'
    )
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

  it('traduz só as palavras do código de inelegibilidade que conhece', () => {
    expect(describeIneligibility('alreadyHaveActiveExchangeRequest contactSAC', label).text).toBe(
      'Já existe uma solicitação de troca ativa para o pedido; Orientar o cliente a procurar o SAC'
    )
    expect(describeIneligibility('codigoNovo', label)).toEqual({ text: 'codigoNovo', raw: 'codigoNovo' })
    expect(describeIneligibility(null, label)).toEqual({ text: '', raw: '' })
  })
})
