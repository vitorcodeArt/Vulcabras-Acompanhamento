// Datas no fuso do contrato (America/Sao_Paulo). Formato de período: YYYY-MM-DD, inclusivo.
export const TIMEZONE = 'America/Sao_Paulo'

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

/** 'YYYY-MM-DD' de um instante, no fuso de São Paulo. */
export function dateKey(input) {
  return dayFormatter.format(new Date(input))
}

export function today(now = Date.now()) {
  return dateKey(now)
}

/** Soma dias a um 'YYYY-MM-DD' (aritmética em UTC, sem horário de verão). */
export function addDays(key, days) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

export const PERIODS = {
  today: 1,
  '7d': 7,
  '30d': 30
}

/** Período predefinido -> { from, to } (hoje incluído). */
export function periodRange(preset, now = Date.now()) {
  const days = PERIODS[preset]
  if (!days) throw new Error(`Período desconhecido: ${preset}`)
  const to = today(now)
  return { from: addDays(to, -(days - 1)), to }
}

export function daysBetween(from, to) {
  const toMs = (k) => Date.UTC(...k.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
  return Math.round((toMs(to) - toMs(from)) / 86400000) + 1
}
