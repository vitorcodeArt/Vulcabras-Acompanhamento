import { formatNumber } from '../../../lib/format'

/** Resultado da linha: troca/devolução usa `outcome_label` da API; catálogo resume produtos e carrinho. */
export function resultText(item, t) {
  if (item.outcome_label) return item.outcome_label
  if (item.flow === 'catalog' && item.click_status === 'clicked') {
    return t('sends.catalog_result', {
      views: formatNumber(item.products_viewed),
      cart: formatNumber(item.cart_clicks)
    })
  }
  return '–'
}

/** Rótulo da última etapa: prefere `last_step_label` da API; senão o texto fixo da interface. */
export function lastStepText(item, label) {
  if (!item.last_step) return '–'
  return item.last_step_label ?? label('steps', item.last_step)
}
