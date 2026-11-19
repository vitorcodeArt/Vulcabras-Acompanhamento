import { useMemo, useState, useEffect, createContext } from 'react'
import { createDemoClient } from '../../zaf/demoClient'
import { isDemoByUrl } from '../config'

export const ClientContext = createContext(null)

export function ClientProvider({ children }) {
  const client = useMemo(() => (isDemoByUrl() ? createDemoClient() : window.ZAFClient.init()), [])
  const [appRegistered, setAppRegistered] = useState(false)

  useEffect(() => {
    client.on('app.registered', function () {
      setAppRegistered(true)
    })
  }, [client])

  if (!appRegistered) return null

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
