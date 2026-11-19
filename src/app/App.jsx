import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@zendeskgarden/react-theming'
import { TranslationProvider } from './contexts/TranslationProvider'
import { ApiProvider } from './contexts/ApiProvider'
import Dashboard from './routes/Dashboard'
import { theme } from './theme'

// O cliente da API já faz o retry automático; o react-query só guarda o cache.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 60_000 } }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <TranslationProvider>
        <ApiProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          </QueryClientProvider>
        </ApiProvider>
      </TranslationProvider>
    </ThemeProvider>
  )
}

export default App
