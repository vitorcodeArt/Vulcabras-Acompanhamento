import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'
import { ClientProvider } from '../src/app/contexts/ClientProvider'
import App from '../src/app/App'

const mockClient = {
  on: vi.fn((event, callback) => {
    if (event === 'app.registered') setTimeout(callback, 0)
  }),
  get: vi.fn().mockResolvedValue({ currentUser: { locale: 'pt-BR' } }),
  metadata: vi.fn().mockResolvedValue({ settings: { demo_mode: true } }),
  context: vi.fn().mockResolvedValue({ location: 'nav_bar' }),
  invoke: vi.fn()
}

const renderApp = () =>
  render(
    <ClientProvider>
      <App />
    </ClientProvider>
  )

describe('App', () => {
  beforeEach(() => {
    cleanup()
    window.location.hash = ''
    vi.clearAllMocks()
    vi.stubGlobal('ZAFClient', { init: vi.fn().mockReturnValue(mockClient) })
  })

  it('página única: mostra as quatro abas e os 4 indicadores principais, sem botão de relatórios', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Visão geral' })).toBeDefined())
    ;['Envios', 'Troca/Devolução', 'Catálogo'].forEach((n) =>
      expect(screen.getByRole('tab', { name: n })).toBeDefined()
    )
    await waitFor(() => expect(screen.getAllByText('Taxa de clique').length).toBeGreaterThan(0), { timeout: 3000 })
    ;['Enviados', 'Concluídos', 'Pediram atendente'].forEach((n) =>
      expect(screen.getAllByText(n).length).toBeGreaterThan(0)
    )
    expect(screen.queryByRole('button', { name: 'Abrir relatórios' })).toBeNull()
    expect(mockClient.invoke).not.toHaveBeenCalled()
  })

  it('abas: setas do teclado trocam de aba e o hash guarda a escolha', async () => {
    renderApp()
    const first = await screen.findByRole('tab', { name: 'Visão geral' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    await waitFor(() => expect(window.location.hash).toBe('#/envios'))
    expect(screen.getByRole('tab', { name: 'Envios' }).getAttribute('aria-selected')).toBe('true')
  })

  it('visão geral: mostra os cartões de totais e a tabela equivalente ao gráfico', async () => {
    window.location.hash = '#/visao-geral'
    renderApp()
    await waitFor(() => expect(screen.getByText('Falha no envio')).toBeDefined(), { timeout: 4000 })
    ;['Conclusão (sobre clicados)', 'Conclusão (sobre enviados)', 'Com erro', 'Não clicaram'].forEach((n) =>
      expect(screen.getAllByText(n).length).toBeGreaterThan(0)
    )
    expect(screen.getAllByText('Ver dados em tabela').length).toBeGreaterThan(0)
    expect(screen.getByText('Por marca')).toBeDefined()
  })

  it('funil de troca/devolução: etapas com quantidade, queda e tempo médio', async () => {
    window.location.hash = '#/troca-devolucao'
    renderApp()
    await waitFor(() => expect(screen.getByText('Abriram')).toBeDefined(), { timeout: 4000 })
    expect(screen.getAllByText('Enviados').length).toBeGreaterThan(0)
    expect(screen.getByText('Abriram')).toBeDefined()
    expect(screen.getByText('Concluíram')).toBeDefined()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(10)
  })
})

describe('Envios e jornada', () => {
  beforeEach(() => {
    cleanup()
    window.location.hash = '#/envios'
    vi.clearAllMocks()
    vi.stubGlobal('ZAFClient', { init: vi.fn().mockReturnValue(mockClient) })
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue() } })
  })

  it('tabela: colunas, chips com texto, copiar ID e carregar mais por cursor', async () => {
    renderApp()
    const table = await screen.findByRole('table', { name: 'Envios' }, { timeout: 4000 })
    ;[
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
    ].forEach((c) => expect(screen.getByRole('columnheader', { name: c })).toBeDefined())
    expect(table.querySelectorAll('tbody tr').length).toBe(50)
    expect(screen.getAllByText(/Clicou|Sem clique|Falha no envio/).length).toBeGreaterThan(10)

    fireEvent.click(screen.getAllByRole('button', { name: /Copiar ID da conversa/ })[0])
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringMatching(/^demo/)))

    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))
    await waitFor(() => expect(table.querySelectorAll('tbody tr').length).toBeGreaterThan(50), { timeout: 4000 })
  })

  it('busca: rejeita menos de 3 caracteres e filtra por nome', async () => {
    renderApp()
    const box = await screen.findByRole('searchbox', { name: 'Buscar envio' }, { timeout: 4000 })
    fireEvent.change(box, { target: { value: 'ab' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(screen.getByText('Digite ao menos 3 caracteres.')).toBeDefined()

    fireEvent.change(box, { target: { value: 'zzzz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(screen.getByText('Nenhum envio encontrado com esses filtros.')).toBeDefined(), {
      timeout: 4000
    })
  })

  it('linha abre a jornada com linha do tempo e ticket abre dentro da Zendesk', async () => {
    renderApp()
    await screen.findByRole('table', { name: 'Envios' }, { timeout: 4000 })
    fireEvent.click(screen.getAllByRole('button', { name: /Ver jornada/ })[0])
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/envios\/demo-send-/))
    await screen.findByText('Jornada do envio', {}, { timeout: 4000 })
    expect(screen.getByRole('button', { name: /Voltar para envios/ })).toBeDefined()
    expect(screen.getByText('Linha do tempo')).toBeDefined()
  })

  it('envio sem clique mostra a mensagem de botão sem abertura', async () => {
    const { mockTransport } = await import('../src/api/mock')
    const { data } = await mockTransport({ path: '/sends', params: { click_status: 'not_clicked', limit: 1 } })
    window.location.hash = `#/envios/${data.items[0].send_id}`
    renderApp()
    await waitFor(() => expect(screen.getByText(/sem abertura registrada/)).toBeDefined(), { timeout: 4000 })
  })
})

describe('Relatórios de troca/devolução e catálogo', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.stubGlobal('ZAFClient', { init: vi.fn().mockReturnValue(mockClient) })
  })

  it('troca/devolução: totais, tipos, motivos, resultados, vale-compras, atendente, erros e marca', async () => {
    window.location.hash = '#/troca-devolucao'
    renderApp()
    await screen.findByText('Solicitações concluídas', {}, { timeout: 4000 })
    ;[
      'Tempo médio',
      'Trocas x devoluções',
      'Motivos',
      'Resultados',
      'Vale-compras',
      'Pedidos de atendente por motivo',
      'Erros por tipo',
      'Por marca'
    ].forEach((n) => expect(screen.getAllByText(n).length).toBeGreaterThan(0))
    expect(screen.getByText('Oferecido')).toBeDefined()
    expect(screen.getByText('Aceito')).toBeDefined()
    expect(screen.getByText('Troca')).toBeDefined()
  })

  it('catálogo: nota do carrinho sempre visível e relatórios de buscas e produtos', async () => {
    window.location.hash = '#/catalogo'
    renderApp()
    expect(
      await screen.findByText('Carrinho = clique no botão de adicionar ao carrinho; não confirma compra.')
    ).toBeDefined()
    await screen.findByText('Produtos mais vistos', {}, { timeout: 4000 })
    ;[
      'Categorias mais vistas',
      'Tamanhos e cores mais escolhidos',
      'Buscas mais feitas',
      'Buscas sem resultado'
    ].forEach((n) => expect(screen.getAllByText(n).length).toBeGreaterThan(0))
  })
})

describe('Exportar CSV', () => {
  let blobs
  let clicked
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    blobs = []
    clicked = []
    window.history.pushState({}, '', '/')
    vi.stubGlobal('ZAFClient', { init: vi.fn().mockReturnValue(mockClient) })
    URL.createObjectURL = vi.fn((blob) => {
      blobs.push(blob)
      return 'blob:demo'
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked.push(this.download)
    })
  })

  const readBlob = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(blob)
    })

  it.each([
    ['#/envios', 'envios_'],
    ['#/troca-devolucao', 'troca-devolucao_'],
    ['#/catalogo', 'catalogo_']
  ])('%s: baixa o CSV do contrato como arquivo', async (hash, prefix) => {
    window.location.hash = hash
    renderApp()
    fireEvent.click(await screen.findByRole('button', { name: /Exportar CSV/ }, { timeout: 4000 }))
    await waitFor(() => expect(clicked.length).toBe(1), { timeout: 4000 })
    expect(clicked[0]).toMatch(new RegExp(`^${prefix}\\d{4}-\\d{2}-\\d{2}_a_\\d{4}-\\d{2}-\\d{2}\\.csv$`))
    const text = await readBlob(blobs[0])
    expect(text.split('\n')[0]).toContain(';')
    expect(blobs[0].type).toContain('text/csv')
  })

  it('erro de autorização aparece com "Tentar de novo" e nada é baixado', async () => {
    window.history.pushState({}, '', '/?mock_error=401')
    window.location.hash = '#/catalogo'
    renderApp()
    fireEvent.click(await screen.findByRole('button', { name: /Exportar CSV/ }, { timeout: 4000 }))
    expect((await screen.findAllByText(/Acesso negado/, {}, { timeout: 4000 })).length).toBeGreaterThan(0)
    expect(clicked.length).toBe(0)
  })
})

describe('Diagnóstico do erro na jornada', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
    vi.stubGlobal('ZAFClient', { init: vi.fn().mockReturnValue(mockClient) })
  })

  // Varre os 30 dias que o mock gera, procurando um envio com erro que satisfaça o predicado
  const findSend = async (predicate) => {
    const { mockTransport } = await import('../src/api/mock')
    const { addDays, today } = await import('../src/lib/dates')
    const range = { from: addDays(today(), -30), to: today(), status: 'error', limit: 100 }
    let cursor
    do {
      const { data } = await mockTransport({ path: '/sends', params: { ...range, cursor } })
      for (const item of data.items) {
        const detail = await mockTransport({ path: `/sends/${item.send_id}` })
        if (predicate(detail.data.events)) return item.send_id
      }
      cursor = data.next_cursor
    } while (cursor)
    return null
  }

  it('pedido não elegível: explica o motivo em português e mostra o código bruto', async () => {
    const id = await findSend((events) => events.some((e) => e.meta?.eligible === false))
    expect(id).not.toBeNull()
    window.location.hash = `#/envios/${id}`
    renderApp()
    expect(await screen.findByText('Diagnóstico do erro', {}, { timeout: 5000 })).toBeDefined()
    expect(screen.getByText('Pedido não elegível para troca ou devolução')).toBeDefined()
    expect(
      screen.getByText('Já existe uma solicitação de troca ativa para o pedido; Orientar o cliente a procurar o SAC')
    ).toBeDefined()
    expect(screen.getAllByText(/alreadyHaveActiveExchangeRequest contactSAC/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terminou com erro').length).toBeGreaterThan(0) // status corrigido: não é "Abandonou"
    expect(screen.getAllByText('Tela de erro').length).toBeGreaterThanOrEqual(2) // última etapa e linha do tempo
  })

  it('falha de integração: mostra a ferramenta, o status HTTP e a tentativa', async () => {
    const id = await findSend((events) => events.some((e) => e.event === 'api_call' && e.meta?.ok === false))
    expect(id).not.toBeNull()
    window.location.hash = `#/envios/${id}`
    renderApp()
    expect(await screen.findByText('Falha na integração: create_reverse_order', {}, { timeout: 5000 })).toBeDefined()
    expect(screen.getAllByText('Falha temporária no Troque').length).toBeGreaterThan(0)
    expect(screen.getAllByText('503').length).toBeGreaterThan(0)
  })

  it('jornada que concluiu não mostra diagnóstico', async () => {
    const { mockTransport } = await import('../src/api/mock')
    const { data } = await mockTransport({ path: '/sends', params: { status: 'completed', flow: 'reverse', limit: 1 } })
    window.location.hash = `#/envios/${data.items[0].send_id}`
    renderApp()
    await screen.findByText('Linha do tempo', {}, { timeout: 5000 })
    expect(screen.queryByText('Diagnóstico do erro')).toBeNull()
  })
})
