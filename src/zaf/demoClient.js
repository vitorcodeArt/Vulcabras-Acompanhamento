// Cliente ZAF de mentira para o modo demonstração no navegador (`npm run dev?mock=1`).
// Só cobre o que o app usa; `request` não existe porque o modo demo usa o transporte fictício.
export function createDemoClient() {
  return {
    on(event, callback) {
      if (event === 'app.registered') setTimeout(callback, 0)
    },
    async context() {
      return { location: 'nav_bar' }
    },
    async get(path) {
      if (path === 'currentUser') return { currentUser: { locale: 'pt-BR' } }
      return {}
    },
    async metadata() {
      return { settings: { demo_mode: true } }
    },
    async invoke(name, ...args) {
      if (name === 'instances.create') {
        // No navegador não há ZAF: a nova aba precisa herdar ?mock=1 (e ?mock_error, se houver).
        const { url } = args[0] ?? {}
        const target = new URL(url, window.location.href)
        const current = new URLSearchParams(window.location.search)
        target.searchParams.set('mock', '1')
        if (current.get('mock_error')) target.searchParams.set('mock_error', current.get('mock_error'))
        window.open(target.toString(), '_blank', 'noopener')
      } else {
        console.info('[demo] invoke', name, ...args)
      }
    }
  }
}
