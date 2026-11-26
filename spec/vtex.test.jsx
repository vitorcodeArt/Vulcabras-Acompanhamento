import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@zendeskgarden/react-theming'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TranslationContext } from '../src/app/contexts/TranslationProvider'
import { ApiError } from '../src/api/errors'
import { theme } from '../src/app/theme'
import { formatDate, formatMoney } from '../src/lib/format'
import { mockTransport } from '../src/api/mock'
import { addDays, today } from '../src/lib/dates'
import I18n from '../src/lib/i18n'

const get = vi.fn()
vi.mock('../src/app/hooks/useApi', () => ({ useApi: () => ({ api: { get }, demo: true }) }))

const { default: VtexOrder } = await import('../src/app/routes/reports/VtexOrder')

const i18n = new I18n()
await i18n.loadTranslations('pt')

const renderCard = () =>
  render(
    <ThemeProvider theme={theme}>
      <TranslationContext.Provider value={{ i18n }}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <VtexOrder sendId="demo-send-1" />
        </QueryClientProvider>
      </TranslationContext.Provider>
    </ThemeProvider>
  )

// Pedido fictício no formato do contrato
const ORDER = {
  order_id: '1000000000000-01',
  status: 'invoiced',
  status_label: 'Faturado',
  created_at: '2026-10-21T19:08:27Z',
  invoiced_at: '2026-10-22T01:32:19Z',
  totals: { items_cents: 17999, discounts_cents: -6300, shipping_cents: 986, total_cents: 12685 },
  items: [
    {
      name: 'Tênis Demo',
      variation: '40 Preto',
      ref_id: '0000000-001-40',
      quantity: 1,
      price_cents: 11699,
      list_price_cents: 24999,
      image_url: 'https://exemplo.invalid/foto.jpg'
    }
  ],
  shipping: { courier: 'Transportadora Demo', method: 'Normal', estimate_at: '2026-10-28T19:08:38Z' },
  packages: [
    {
      courier: 'Transportadora Demo',
      tracking_number: 'DEMO123',
      tracking_url: 'https://exemplo.invalid/rastreio',
      delivered_at: '2026-10-27T09:51:00Z'
    }
  ],
  payments: [{ method: 'Mastercard', installments: 2 }]
}

const answer = (data) => ({ data: { order_number: '1000000000000-01', order_verified: true, reason: null, ...data } })
const text = (container) => container.textContent.replace(/\u00a0/g, ' ')

describe('formatação', () => {
  it('centavos em reais e datas', () => {
    expect(formatMoney(12685).replace(/\u00a0/g, ' ')).toBe('R$ 126,85')
    expect(formatMoney(-6300).replace(/\u00a0/g, ' ')).toBe('-R$ 63,00')
    expect(formatMoney(null)).toBe('–')
    expect(formatDate('2026-10-28T19:08:38Z')).toBe('28/10/2026')
  })
})

describe('Pedido na VTEX', () => {
  beforeEach(() => {
    cleanup()
    get.mockReset()
  })

  it('mostra imagem, produto, valores, entrega, rastreio e pagamento', async () => {
    get.mockResolvedValue(answer({ order: ORDER }))
    const { container } = renderCard()
    await screen.findByText('Tênis Demo')
    expect(get).toHaveBeenCalledWith('/sends/demo-send-1/order', undefined)
    const image = container.querySelector('img')
    expect(image.getAttribute('src')).toBe('https://exemplo.invalid/foto.jpg')
    expect(image.getAttribute('referrerpolicy')).toBe('no-referrer')
    const content = text(container)
    ;[
      '40 Preto',
      'R$ 116,99',
      'R$ 249,99',
      'R$ 126,85',
      'Faturado',
      'Transportadora Demo',
      '28/10/2026',
      'entregue em 27/10/2026',
      'Mastercard · 2x'
    ].forEach((value) => expect(content).toContain(value))
    const link = screen.getByRole('link', { name: 'Rastrear' })
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('ignora imagem e link que não sejam https', async () => {
    const unsafe = {
      ...ORDER,
      items: [{ ...ORDER.items[0], image_url: 'http://exemplo.invalid/a.jpg' }],
      packages: [{ tracking_number: 'DEMO123', tracking_url: 'javascript:alert(1)' }]
    }
    get.mockResolvedValue(answer({ order: unsafe }))
    const { container } = renderCard()
    await screen.findByText('Tênis Demo')
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('número não confirmado: avisa que o pedido pode não ser do cliente', async () => {
    get.mockResolvedValue(answer({ order: ORDER, order_verified: false }))
    renderCard()
    expect((await screen.findByRole('alert')).textContent).toContain('Pode não ser deste cliente')
  })

  it.each([
    ['not_found', 'A VTEX não encontrou um pedido com esse número.'],
    ['forbidden', 'A chave da VTEX não tem permissão para ler pedidos. Acione a TI.'],
    ['not_configured', 'A consulta à VTEX não está configurada para esta marca.'],
    ['no_order_number', 'Não há número de pedido para consultar.'],
    ['motivo_novo', 'A VTEX não respondeu. Tente de novo em instantes.']
  ])('sem pedido (%s) explica o motivo', async (reason, message) => {
    get.mockResolvedValue(answer({ order: null, reason }))
    renderCard()
    expect(await screen.findByText(message)).toBeDefined()
  })

  it('VTEX indisponível permite tentar de novo', async () => {
    get
      .mockResolvedValueOnce(answer({ order: null, reason: 'unavailable' }))
      .mockResolvedValue(answer({ order: ORDER }))
    renderCard()
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Tênis Demo')).toBeDefined()
  })

  it('backend antigo, sem a rota: aviso em vez de erro', async () => {
    get.mockRejectedValue(new ApiError('not_found', { status: 404, serverMessage: 'Rota não encontrada.' }))
    renderCard()
    expect(await screen.findByText('A consulta à VTEX ainda não está disponível no servidor.')).toBeDefined()
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })
})

describe('modo demonstração', () => {
  it('/sends/:id/order segue o contrato', async () => {
    const range = { from: addDays(today(), -30), to: today(), status: 'completed', flow: 'reverse', limit: 1 }
    const list = await mockTransport({ path: '/sends', params: range })
    const { data } = await mockTransport({ path: `/sends/${list.data.items[0].send_id}/order` })
    expect(data.reason).toBeNull()
    expect(data.order.items.length).toBeGreaterThan(0)
    expect(Number.isInteger(data.order.totals.total_cents)).toBe(true)
  })
})
