import { useI18n } from '../../hooks/useI18n'
import { useLabel } from '../../hooks/useLabel'
import { useApiQuery } from '../../../api/hooks'
import { formatNumber, formatRate, ratio } from '../../../lib/format'
import BarList from '../../components/BarList'
import InfoNote from '../../components/InfoNote'
import KpiCard from '../../components/KpiCard'
import QueryBoundary from '../../components/QueryBoundary'
import { CardGrid, KpiRow, ReportStack } from '../../components/ReportLayout'

/** Relatório de Catálogo (`/reports/catalog`). "Carrinho" é clique no botão, não compra. */
export default function CatalogReport({ params }) {
  const { t } = useI18n()
  const label = useLabel()
  const query = useApiQuery('/reports/catalog', params)
  const c = (key) => t(`catalog.${key}`)

  return (
    <ReportStack>
      <InfoNote>{c('cart_note')}</InfoNote>
      <QueryBoundary query={query} isEmpty={(d) => d.totals.sessions === 0} emptyText={c('empty')} lines={6}>
        {(d) => (
          <>
            <KpiRow>
              <KpiCard hero icon="click" label={c('sessions')} value={formatNumber(d.totals.sessions)} />
              <KpiCard
                icon="chart"
                label={c('product_rate')}
                value={formatRate(ratio(d.totals.with_product_view, d.totals.sessions))}
                details={[{ label: c('with_product'), value: formatNumber(d.totals.with_product_view) }]}
              />
              <KpiCard
                icon="send"
                label={c('cart_rate')}
                value={formatRate(d.totals.cart_rate)}
                details={[{ label: c('with_cart'), value: formatNumber(d.totals.with_cart_click) }]}
              />
              <KpiCard
                icon="search"
                label={c('searches')}
                value={formatNumber(d.searches.total)}
                details={[{ label: c('no_results'), value: formatNumber(d.searches.no_results) }]}
              />
            </KpiRow>

            <CardGrid>
              <BarList
                title={c('top_categories')}
                items={(d.top_categories ?? []).map((row) => ({ key: row.key, label: row.key, value: row.count }))}
              />
              <BarList
                title={c('top_products')}
                items={(d.top_products ?? []).map((row) => ({
                  key: row.product_id,
                  label: row.title,
                  value: row.views,
                  sub: `${c('cart_clicks')}: ${formatNumber(row.cart_clicks)}`
                }))}
              />
              <BarList
                title={c('top_variations')}
                items={(d.top_variations ?? []).map((row) => ({
                  key: `${row.size}|${row.color}`,
                  label: `${row.size} · ${row.color}`,
                  value: row.count
                }))}
              />
              <BarList
                title={c('top_terms')}
                items={(d.searches.top_terms ?? []).map((row) => ({
                  key: row.term,
                  label: row.term,
                  value: row.count,
                  sub: row.no_results_count ? `${c('no_results')}: ${formatNumber(row.no_results_count)}` : undefined
                }))}
              />
              <BarList
                title={c('no_result_terms')}
                hint={`${c('no_results')}: ${formatNumber(d.searches.no_results)}`}
                emptyText={c('no_no_results')}
                items={(d.searches.top_terms ?? [])
                  .filter((row) => row.no_results_count > 0)
                  .sort((a, b) => b.no_results_count - a.no_results_count)
                  .map((row) => ({ key: row.term, label: row.term, value: row.no_results_count }))}
              />
              <BarList
                title={t('overview.by_brand')}
                items={(d.by_brand ?? []).map((row) => ({
                  key: row.key,
                  label: label('brands', row.key),
                  value: row.sessions,
                  sub: `${c('with_cart')}: ${formatNumber(row.with_cart_click)} (${formatRate(ratio(row.with_cart_click, row.sessions))})`
                }))}
              />
            </CardGrid>
          </>
        )}
      </QueryBoundary>
    </ReportStack>
  )
}
