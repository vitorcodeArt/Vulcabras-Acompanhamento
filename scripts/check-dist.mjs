// Checagem OFFLINE do pacote em dist/ (complementa `zcli apps:validate`, que exige login na Zendesk).
// Uso: npm run check:dist           -> exige domainWhitelist (necessário para o modo real)
//      npm run check:dist -- --demo -> permite pacote sem domainWhitelist (só modo demonstração)
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'dist')
const demoOnly = process.argv.includes('--demo')
const problems = []
const fail = (msg) => problems.push(msg)
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(root, p))

if (!exists('manifest.json')) {
  console.error(`manifest.json não encontrado em ${root}. Rode "npm run build" antes.`)
  process.exit(1)
}

const manifest = JSON.parse(read('manifest.json'))

if (manifest.frameworkVersion !== '2.0') fail('frameworkVersion deve ser "2.0"')
if (manifest.defaultLocale !== 'pt') fail('defaultLocale deve ser "pt"')
if (!manifest.author?.name || !manifest.author?.email) fail('author.name e author.email são obrigatórios')

const locations = Object.keys(manifest.location?.support ?? {})
if (locations.length !== 1 || locations[0] !== 'nav_bar')
  fail(`location deve ser só support.nav_bar (achei: ${locations.join(', ')})`)
const url = manifest.location?.support?.nav_bar?.url
if (url !== 'assets/iframe.html')
  fail(`nav_bar.url deve ser "assets/iframe.html" (achei: ${url}). Gere com "npm run build" (modo production).`)

const params = Object.fromEntries((manifest.parameters ?? []).map((p) => [p.name, p]))
if (!params.api_host?.required) fail('parâmetro api_host obrigatório ausente')
if (!(params.api_secret?.required && params.api_secret?.secure === true))
  fail('api_secret deve ser required e secure: true')
Object.keys(params).forEach((name) => {
  if (name !== 'api_secret' && params[name].secure) fail(`${name} não deveria ser secure`)
})

if (!demoOnly) {
  if (!manifest.domainWhitelist?.length)
    fail('domainWhitelist ausente: defina VITE_API_DOMAIN em .env.local e rode "npm run build" (ou use --demo)')
  else if (manifest.domainWhitelist.some((h) => /[/:*\s]/.test(h)))
    fail('domainWhitelist deve conter só o hostname (sem https:// nem caminho)')
}

;[
  'assets/iframe.html',
  'assets/icon_nav_bar.svg',
  'assets/logo.png',
  'assets/logo-small.png',
  'translations/pt.json',
  'translations/en.json'
].forEach((f) => {
  if (!exists(f)) fail(`arquivo ausente: ${f}`)
})

const png = (f) => {
  const b = fs.readFileSync(path.join(root, f))
  return b.readUInt32BE(16) + 'x' + b.readUInt32BE(20)
}
if (exists('assets/logo.png') && png('assets/logo.png') !== '320x320') fail('logo.png deve ter 320x320')
if (exists('assets/logo-small.png') && png('assets/logo-small.png') !== '128x128')
  fail('logo-small.png deve ter 128x128')

for (const loc of ['pt', 'en']) {
  if (!exists(`translations/${loc}.json`)) continue
  const t = JSON.parse(read(`translations/${loc}.json`))
  ;['name', 'short_description', 'long_description'].forEach(
    (k) => !t.app?.[k] && fail(`translations/${loc}.json: app.${k} ausente`)
  )
  Object.keys(params).forEach(
    (n) => !t.app?.parameters?.[n]?.label && fail(`translations/${loc}.json: rótulo do parâmetro ${n} ausente`)
  )
}

// Nenhum segredo ou host privado no bundle.
const bundle = fs
  .readdirSync(path.join(root, 'assets'))
  .filter((f) => /\.(js|css|html)$/.test(f))
  .map((f) => [f, read(`assets/${f}`)])
for (const [f, text] of bundle) {
  if (/Bearer\s+(?!\{\{setting\.api_secret\}\})[A-Za-z0-9._~+/=-]{8,}/.test(text))
    fail(`${f}: possível token Bearer literal`)
  if (/onrender\.com/.test(text)) fail(`${f}: contém um host onrender.com`)
  const host = manifest.domainWhitelist?.[0]
  if (host && text.includes(host)) fail(`${f}: contém o host do backend (${host}); ele só deveria estar no manifest`)
}

if (problems.length) {
  console.error(`✖ ${problems.length} problema(s) em ${root}:\n` + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log(
  `✔ ${root} OK${demoOnly ? ' (modo demonstração: sem domainWhitelist)' : ''}. Falta só "zcli apps:validate" e "zcli apps:package" (exigem login).`
)
