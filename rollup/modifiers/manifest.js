const JS_INDENT = 2

export function changeLocation(content, filename) {
  const manifest = JSON.parse(content)

  manifest.location = Object.keys(manifest.location).reduce((acc, key) => {
    const app = manifest.location[key]

    const appLocations = Object.keys(app).reduce((acc, key) => {
      const value = app[key]
      return { ...acc, [key]: { ...value, url: process.env.VITE_ZENDESK_LOCATION } }
    }, {})

    return { ...acc, [key]: appLocations }
  }, {})

  // Host do backend (só o hostname) vem do ambiente, nunca do repositório.
  // Defina VITE_API_DOMAIN em .env.local (ignorado pelo git). Necessário para requisições `secure: true`.
  const apiDomain = (process.env.VITE_API_DOMAIN || '').trim()
  if (apiDomain) {
    manifest.domainWhitelist = [apiDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')]
  } else {
    console.warn('[manifest] VITE_API_DOMAIN não definido: domainWhitelist ficará de fora (veja README).')
  }

  const manifestOutput = {
    _warning: `AUTOMATICALLY GENERATED FROM $/src/${filename} - DO NOT MODIFY THIS FILE DIRECTLY`,
    ...manifest
  }

  return JSON.stringify(manifestOutput, null, JS_INDENT)
}
