import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { useI18n } from '../hooks/useI18n'
import { useApi } from '../hooks/useApi'
import { useHashRoute } from '../hooks/useHashRoute'
import { periodRange } from '../../lib/dates'
import PeriodFilter from '../components/PeriodFilter'
import FiltersBar from '../components/FiltersBar'
import PillTabs, { panelId, tabId } from '../components/PillTabs'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import Overview from './reports/Overview'
import Funnel from './reports/Funnel'
import Sends from './reports/Sends'
import Journey from './reports/Journey'
import ReverseReport from './reports/ReverseReport'
import CatalogReport from './reports/CatalogReport'
import { ReportStack } from '../components/ReportLayout'
import ExportButton from '../components/ExportButton'

const Page = styled.main`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
`

const Top = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  h1 {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
    font-weight: 700;
    color: ${(p) => p.theme.brand.text};
  }
  p {
    margin: 2px 0 0;
    font-size: 14px;
    color: ${(p) => p.theme.brand.muted};
  }
`

const Mark = styled.span`
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, ${(p) => p.theme.brand.navy}, ${(p) => p.theme.brand.blue700});
`

const Demo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  vertical-align: middle;
  color: ${(p) => p.theme.brand.blue900};
  background: ${(p) => p.theme.brand.blue100};
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${(p) => p.theme.brand.line};
`

export const TABS = [
  { key: 'visao-geral', label: 'dashboard.tabs.overview' },
  { key: 'envios', label: 'dashboard.tabs.sends' },
  { key: 'troca-devolucao', label: 'dashboard.tabs.reverse' },
  { key: 'catalogo', label: 'dashboard.tabs.catalog' }
]

/** O hash guarda a aba e a jornada aberta ('#/envios/<id>'); nada vai para o localStorage. */
export function parseRoute(route) {
  const [key, ...rest] = route.replace(/^\//, '').split('/')
  const tab = TABS.some((t) => t.key === key) ? key : TABS[0].key
  const id = tab === 'envios' && rest[0] ? decodeURIComponent(rest[0]) : null
  return { tab, sendId: id }
}

export default function Dashboard() {
  const { t } = useI18n()
  const { demo } = useApi()
  const { tab: selected, sendId } = parseRoute(useHashRoute())
  const [filters, setFilters] = useState({ period: '7d', brand: '', flow: '' })
  // Filtros da lista de envios ficam aqui para sobreviver à ida e volta para a jornada.
  const [sendsFilters, setSendsFilters] = useState({ q: '', clickStatus: '', status: '' })
  const range = useMemo(() => periodRange(filters.period), [filters.period])
  const params = { ...range, brand: filters.brand, flow: filters.flow }
  const flowParams = { ...range, brand: filters.brand }

  const content = {
    'visao-geral': <Overview params={params} />,
    envios: sendId ? (
      <Journey sendId={sendId} onBack={() => (window.location.hash = '/envios')} />
    ) : (
      <Sends params={params} filters={sendsFilters} onFiltersChange={setSendsFilters} />
    ),
    'troca-devolucao': (
      <ReportStack>
        <Actions>
          <ExportButton report="reverse_sessions" params={flowParams} hint={t('export.flow_hint')} />
        </Actions>
        <ReverseReport params={flowParams} />
        <Funnel flow="reverse" params={flowParams} />
      </ReportStack>
    ),
    catalogo: (
      <ReportStack>
        <Actions>
          <ExportButton report="catalog_products" params={flowParams} hint={t('export.flow_hint')} />
        </Actions>
        <CatalogReport params={flowParams} />
        <Funnel flow="catalog" params={flowParams} />
      </ReportStack>
    )
  }

  return (
    <Page>
      <Top>
        <Brand>
          <Mark>
            <Icon name="chart" size={24} />
          </Mark>
          <div>
            <h1>
              {t('dashboard.title')}
              {demo && <Demo>{t('dashboard.demo_badge')}</Demo>}
            </h1>
            <p>{t('dashboard.subtitle')}</p>
          </div>
        </Brand>
        <PeriodFilter value={filters.period} onChange={(period) => setFilters({ ...filters, period })} />
      </Top>

      <Bar>
        <PillTabs
          label={t('dashboard.title')}
          tabs={TABS.map((tab) => ({ key: tab.key, label: t(tab.label) }))}
          selected={selected}
          onChange={(key) => {
            window.location.hash = `/${key}`
          }}
        />
        {!sendId && (
          <FiltersBar
            filters={filters}
            onChange={setFilters}
            showFlow={selected === 'visao-geral' || selected === 'envios'}
          />
        )}
      </Bar>

      <div role="tabpanel" id={panelId(selected)} aria-labelledby={tabId(selected)} tabIndex={0}>
        {content[selected] ?? <EmptyState>{t('dashboard.coming_soon')}</EmptyState>}
      </div>
    </Page>
  )
}
