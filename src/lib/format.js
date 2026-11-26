// Formatação fixa em pt-BR (os números vêm do contrato; taxas são 0..1 ou null).
const PLACEHOLDER = '–'

const numberFormat = new Intl.NumberFormat('pt-BR')
const rateFormat = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
})

export function formatNumber(value) {
  return Number.isFinite(value) ? numberFormat.format(value) : PLACEHOLDER
}

/** 0.607 -> "60,7%"; null/indefinido -> "–". */
export function formatRate(value) {
  return Number.isFinite(value) ? rateFormat.format(value) : PLACEHOLDER
}

/** 'YYYY-MM-DD' -> 'DD/MM'. */
export function formatShortDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key ?? '')) return PLACEHOLDER
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}

/** Duração em ms ou s -> "31 s", "2 min 5 s". */
export function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return PLACEHOLDER
  const seconds = Math.round(totalSeconds)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

const dateTimeParts = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
})

function parts(iso) {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return null
  return Object.fromEntries(dateTimeParts.formatToParts(date).map((p) => [p.type, p.value]))
}

/** ISO -> "19/11/2026 14:32" no fuso de São Paulo; inválido -> "–". */
export function formatDateTime(iso) {
  const p = parts(iso)
  return p ? `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}` : PLACEHOLDER
}

/** ISO -> "14:32:05" no fuso de São Paulo. */
export function formatTime(iso) {
  const p = parts(iso)
  return p ? `${p.hour}:${p.minute}:${p.second}` : PLACEHOLDER
}

/** Razão segura entre contagens: denominador 0 vira null (o app mostra "–"). */
export function ratio(part, total) {
  return Number.isFinite(part) && Number.isFinite(total) && total > 0 ? part / total : null
}

/** ISO -> "19/11/2026" no fuso de São Paulo. */
export function formatDate(iso) {
  const p = parts(iso)
  return p ? `${p.day}/${p.month}/${p.year}` : PLACEHOLDER
}

const moneyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos -> "R$ 126,85"; ausente -> "–". */
export function formatMoney(cents) {
  return Number.isFinite(cents) ? moneyFormat.format(cents / 100) : PLACEHOLDER
}
