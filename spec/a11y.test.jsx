import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@zendeskgarden/react-theming'
import { ClientProvider } from '../src/app/contexts/ClientProvider'
import { TranslationContext } from '../src/app/contexts/TranslationProvider'
import { ClickChip, SituationChip } from '../src/app/components/StatusChip'
import { resultText, lastStepText } from '../src/app/routes/reports/sendFields'
import { theme } from '../src/app/theme'
import I18n from '../src/lib/i18n'
import App from '../src/app/App'

const mockClient = {
  on: vi.fn((event, callback) => event === 'app.registered' && setTimeout(callback, 0)),
  get: vi.fn().mockResolvedValue({ currentUser: { locale: 'pt-BR' } }),
  metadata: vi.fn().mockResolvedValue({ settings: { demo_mode: true } }),
  context: vi.fn().mockResolvedValue({ location: 'nav_bar' }),
  invoke: vi.fn()
}

const i18n = new I18n()
await i18n.loadTranslations('pt')
const withProviders = (ui) => (
  <ThemeProvider theme={theme}>
    <TranslationContext.Provider value={{ i18n }}>{ui}</TranslationContext.Provider>
  </ThemeProvider>
)

describe('acessibilidade', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.location.hash = '#/envios'
    vi.stubGlobal('ZAFClient', { init: vi.fn().mockReturnValue(mockClient) })
  })

  const renderApp = () =>
    render(
      <ClientProvider>
        <App />
      </ClientProvider>
    )

  it('tem marco main, uma só aba na ordem de tabulação e painel focável', async () => {
    renderApp()
    await screen.findByRole('tab', { name: 'Envios' })
    expect(screen.getByRole('main')).toBeDefined()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Envios' }).tabIndex).toBe(0)
    expect(screen.getByRole('tabpanel').tabIndex).toBe(0)
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: 'Envios' }).id
    )
  })

  it('Home e End vão à primeira e à última aba', async () => {
    renderApp()
    const tab = await screen.findByRole('tab', { name: 'Envios' })
    fireEvent.keyDown(tab, { key: 'End' })
    await waitFor(() => expect(window.location.hash).toBe('#/catalogo'))
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Catálogo' }), { key: 'Home' })
    await waitFor(() => expect(window.location.hash).toBe('#/visao-geral'))
  })

  it('a tabela larga fica numa região focável e nomeada; as linhas têm botão focável', async () => {
    renderApp()
    const region = await screen.findByRole('region', { name: /Tabela de envios/ }, { timeout: 4000 })
    expect(region.tabIndex).toBe(0)
    expect(screen.getAllByRole('button', { name: /Ver jornada/ }).length).toBeGreaterThan(0)
  })

  it('o gráfico tem alternativa em texto e tabela equivalente', async () => {
    window.location.hash = '#/visao-geral'
    renderApp()
    expect(await screen.findByRole('img', { name: /Gráfico de linhas/ }, { timeout: 4000 })).toBeDefined()
    expect(screen.getAllByText('Ver dados em tabela').length).toBeGreaterThan(0)
  })
})

describe('chips de status: ícone + texto, rótulo da API tem prioridade', () => {
  it('sempre mostram o texto', () => {
    const cases = [
      [{ click_status: 'not_clicked' }, 'Sem clique'],
      [{ click_status: 'clicked' }, 'Clicou'],
      [{ click_status: 'send_failed' }, 'Falha no envio']
    ]
    cases.forEach(([item, text]) => {
      const { unmount } = render(withProviders(<ClickChip item={item} />))
      expect(screen.getByText(text)).toBeDefined()
      unmount()
    })
    ;[
      ['completed', 'Concluído'],
      ['handoff', 'Pediu atendente'],
      ['error', 'Terminou com erro'],
      ['abandoned', 'Abandonou'],
      ['in_progress', 'Em andamento']
    ].forEach(([status, text]) => {
      const { unmount, container } = render(withProviders(<SituationChip item={{ session_status: status }} />))
      expect(screen.getByText(text)).toBeDefined()
      expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
      unmount()
    })
  })

  it('sem sessão não há situação; chave desconhecida mostra a própria chave; label da API vence', () => {
    const { container, unmount } = render(withProviders(<SituationChip item={{ session_status: null }} />))
    expect(container.textContent).toBe('–')
    unmount()
    render(withProviders(<SituationChip item={{ session_status: 'novo_status' }} />))
    expect(screen.getByText('novo_status')).toBeDefined()
    cleanup()
    render(withProviders(<ClickChip item={{ click_status: 'clicked', click_status_label: 'Abriu' }} />))
    expect(screen.getByText('Abriu')).toBeDefined()
  })

  it('resultado e última etapa', () => {
    const t = (key, ctx) => `${key}|${ctx?.views}|${ctx?.cart}`
    expect(resultText({ outcome_label: 'Aprovada, com envio' }, t)).toBe('Aprovada, com envio')
    expect(resultText({ flow: 'catalog', click_status: 'clicked', products_viewed: 2, cart_clicks: 1 }, t)).toContain(
      '2|1'
    )
    expect(resultText({ flow: 'reverse', click_status: 'not_clicked' }, t)).toBe('–')
    const label = (g, k) => `${g}:${k}`
    expect(lastStepText({ last_step: 'summary' }, label)).toBe('steps:summary')
    expect(lastStepText({ last_step: 'summary', last_step_label: 'Resumo' }, label)).toBe('Resumo')
    expect(lastStepText({ last_step: null }, label)).toBe('–')
  })
})
