import { useEffect, useState } from 'react'

/** Hash atual sem o '#', acompanhando `hashchange`. Ex.: '/relatorios/envios'. */
export function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '')
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
