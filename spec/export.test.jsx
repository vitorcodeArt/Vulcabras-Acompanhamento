import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@zendeskgarden/react-theming'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TranslationContext } from '../src/app/contexts/TranslationProvider'
import { theme } from '../src/app/theme'
import I18n from '../src/lib/i18n'

const getText = vi.fn()
vi.mock('../src/app/hooks/useApi', () => ({ useApi: () => ({ api: { getText }, demo: true }) }))

const { default: ExportButton } = await import('../src/app/components/ExportButton')

const i18n = new I18n()
await i18n.loadTranslations('pt')

const renderButton = (props) =>
  render(
    <ThemeProvider theme={theme}>
      <TranslationContext.Provider value={{ i18n }}>
        <QueryClientProvider client={new QueryClient()}>
          <ExportButton {...props} />
        </QueryClientProvider>
      </TranslationContext.Provider>
    </ThemeProvider>
  )

describe('ExportButton', () => {
  beforeEach(() => {
    getText.mockReset().mockResolvedValue('﻿a;b\n1;2\n')
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('pede ao /export.csv só report, from, to, brand e flow', async () => {
    renderButton({
      report: 'sends',
      // campos fora do contrato que NÃO podem vazar para a requisição
      params: {
        from: '2026-11-13',
        to: '2026-11-19',
        brand: 'mizuno',
        flow: 'reverse',
        q: 'maria',
        click_status: 'clicked',
        status: 'error'
      }
    })
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }))
    await waitFor(() => expect(getText).toHaveBeenCalledTimes(1))
    expect(getText).toHaveBeenCalledWith('/export.csv', {
      report: 'sends',
      from: '2026-11-13',
      to: '2026-11-19',
      brand: 'mizuno',
      flow: 'reverse'
    })
  })

  it('entrega o texto sem alterar o conteúdo (BOM preservado)', async () => {
    renderButton({ report: 'catalog_products', params: { from: '2026-11-13', to: '2026-11-19' } })
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }))
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())
    const blob = URL.createObjectURL.mock.calls[0][0]
    expect(blob.size).toBe(new Blob(['﻿a;b\n1;2\n']).size)
  })
})
