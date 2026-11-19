import { createContext, useEffect, useMemo, useState } from 'react'
import { useClient } from '../hooks/useClient'
import { isDemoByUrl } from '../config'
import { createApiClient, createZafTransport } from '../../api/client'
import { mockTransport } from '../../api/mock'

export const ApiContext = createContext(null)

/** Lê as configurações (não secretas) uma vez; `api_secret` nunca aparece aqui. */
export function ApiProvider({ children }) {
  const client = useClient()
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    let active = true
    client
      .metadata()
      .then((meta) => active && setSettings(meta?.settings ?? {}))
      .catch(() => active && setSettings({}))
    return () => {
      active = false
    }
  }, [client])

  const value = useMemo(() => {
    if (!settings) return null
    const demo = isDemoByUrl() || settings.demo_mode === true || settings.demo_mode === 'true'
    const transport = demo ? mockTransport : createZafTransport(client, async () => settings)
    return { demo, api: createApiClient({ transport }) }
  }, [client, settings])

  if (!value) return null
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}
