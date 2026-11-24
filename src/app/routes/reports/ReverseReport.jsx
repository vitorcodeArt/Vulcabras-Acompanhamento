import styled from 'styled-components'
import { useI18n } from '../../hooks/useI18n'
import { useLabel } from '../../hooks/useLabel'
import { useApiQuery } from '../../../api/hooks'
import { formatDuration, formatNumber, formatRate, ratio } from '../../../lib/format'
import BarList from '../../components/BarList'
import { Card, CardHint, CardTitle } from '../../components/Card'
import KpiCard from '../../components/KpiCard'
import QueryBoundary from '../../components/QueryBoundary'
import { CardGrid, KpiRow, ReportStack } from '../../components/ReportLayout'

const Big = styled.div`
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: ${(p) => p.theme.brand.text};
`

const Track = styled.div`
  margin: 12px 0 8px;
  height: 12px;
  border-radius: 999px;
  background: ${(p) => p.theme.brand.blue100};
  overflow: hidden;
`

const Fill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, ${(p) => p.theme.brand.blue900}, ${(p) => p.theme.brand.blue500});
`

const Facts = styled.dl`
  margin: 12px 0 0;
  display: flex;
  gap: 24px;
  font-size: 14px;
  dt {
    color: ${(p) => p.theme.brand.muted};
  }
  dd {
    margin: 2px 0 0;
    font-weight: 700;
  }
`

/** Itens de ranking do contrato ({ key, count, label? }); "outros" ganha rótulo fixo. */
function toItems(list, t, nameOf) {
  return (list ?? []).map((row) => ({
    key: row.key,
    label: row.key === 'outros' ? t('common.others') : nameOf(row),
    value: row.count
  }))
}

/** Relatório de Troca/Devolução (`/reports/reverse`). */
export default function ReverseReport({ params }) {
  const { t } = useI18n()
  const label = useLabel()
  const query = useApiQuery('/reports/reverse', params)
  const r = (key) => t(`reverse.${key}`)

  return (
    <QueryBoundary query={query} isEmpty={(d) => d.totals.sessions === 0} emptyText={r('empty')} lines={6}>
      {(d) => (
        <ReportStack>
          <KpiRow>
            <KpiCard
              hero
              icon="check"
              label={r('completed')}
              value={formatNumber(d.totals.completed)}
              details={[{ label: r('sessions'), value: formatNumber(d.totals.sessions) }]}
            />
            <KpiCard
              icon="clock"
              label={r('avg_time')}
              value={formatDuration(d.totals.avg_seconds_to_complete)}
              details={[{ label: r('p90'), value: formatDuration(d.totals.p90_seconds_to_complete) }]}
            />
            <KpiCard icon="headset" label={r('handoff')} value={formatNumber(d.totals.handoff)} />
            <KpiCard icon="alert" label={r('errors')} value={formatNumber(d.totals.errors)} />
          </KpiRow>

          <CardGrid>
            <BarList
              title={r('by_type')}
              hint={r('by_type_hint')}
              items={toItems(d.by_type, t, (row) => label('requestTypes', row.key))}
            />
            <BarList title={r('by_reason')} items={toItems(d.by_reason, t, (row) => row.key)} />
            <BarList title={r('by_outcome')} items={toItems(d.by_outcome, t, (row) => row.label ?? row.key)} />

            <Card>
              <CardTitle>{r('retention')}</CardTitle>
              <CardHint>{r('retention_hint')}</CardHint>
              <Big>{formatRate(d.retention.accept_rate)}</Big>
              <Track aria-hidden="true">
                <Fill style={{ width: `${(d.retention.accept_rate ?? 0) * 100}%` }} />
              </Track>
              <Facts>
                <div>
                  <dt>{r('offered')}</dt>
                  <dd>{formatNumber(d.retention.offered)}</dd>
                </div>
                <div>
                  <dt>{r('accepted')}</dt>
                  <dd>{formatNumber(d.retention.accepted)}</dd>
                </div>
              </Facts>
            </Card>

            <BarList
              title={r('handoff_by_reason')}
              items={toItems(d.handoff_by_reason, t, (row) => row.key)}
              emptyText={r('no_handoff')}
            />
            <BarList
              title={r('errors_by_code')}
              items={toItems(d.errors_by_code, t, (row) =>
                row.key === 'desconhecido' ? r('unknown_error') : (row.label ?? row.key)
              )}
              emptyText={r('no_errors')}
            />

            <BarList
              title={t('overview.by_brand')}
              items={(d.by_brand ?? []).map((row) => ({
                key: row.key,
                label: label('brands', row.key),
                value: row.sessions,
                sub: `${r('completed')}: ${formatNumber(row.completed)} (${formatRate(ratio(row.completed, row.sessions))})`
              }))}
            />
          </CardGrid>
        </ReportStack>
      )}
    </QueryBoundary>
  )
}
