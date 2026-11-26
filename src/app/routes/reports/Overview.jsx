import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Body, Cell, Head, HeaderCell, HeaderRow, Row, Table } from '@zendeskgarden/react-tables'
import styled, { useTheme } from 'styled-components'
import { useI18n } from '../../hooks/useI18n'
import { useLabel } from '../../hooks/useLabel'
import { useApiQuery } from '../../../api/hooks'
import { formatNumber, formatRate, formatShortDate } from '../../../lib/format'
import QueryBoundary from '../../components/QueryBoundary'
import KpiCard from '../../components/KpiCard'
import { Card, CardHint, CardTitle } from '../../components/Card'
import { TableScroll } from '../../components/ReportLayout'

const Stack = styled.div`
  display: grid;
  gap: 20px;
`

const Kpis = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
`

const Split = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
  gap: 20px;
  align-items: start;
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
`

const RowHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.brand.text};
`

const Track = styled.div`
  margin: 6px 0;
  height: 10px;
  border-radius: 999px;
  background: ${(p) => p.theme.brand.blue100};
  overflow: hidden;
`

const Fill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, ${(p) => p.theme.brand.blue900}, ${(p) => p.theme.brand.blue500});
`

const Sub = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
`

const Details = styled.details`
  margin-top: 12px;
  summary {
    cursor: pointer;
    font-size: 13px;
    color: ${(p) => p.theme.brand.blue700};
    padding: 4px 0;
  }
  summary:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

const TipBox = styled.div`
  background: ${(p) => p.theme.brand.navy};
  color: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  box-shadow: 0 8px 22px rgba(11, 42, 91, 0.3);
  p {
    margin: 0 0 6px;
    font-weight: 600;
  }
  div {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <TipBox>
      <p>{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey}>
          <Dot $color={item.stroke} />
          {item.name}: <strong>{formatNumber(item.value)}</strong>
        </div>
      ))}
    </TipBox>
  )
}

function DailyChart({ daily }) {
  const { t } = useI18n()
  const { brand } = useTheme()
  const data = daily.map((d) => ({ ...d, label: formatShortDate(d.date) }))
  const names = {
    sends: t('overview.series.sends'),
    clicked: t('overview.series.clicked'),
    completed: t('overview.series.completed')
  }
  return (
    <Card>
      <CardTitle id="daily-title">{t('overview.daily')}</CardTitle>
      <CardHint>{t('overview.daily_hint')}</CardHint>
      <div role="img" aria-label={t('overview.daily_alt')}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart accessibilityLayer={false} data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="sendsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand.blue500} stopOpacity={0.35} />
                <stop offset="100%" stopColor={brand.blue500} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" vertical={false} stroke={brand.line} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: brand.muted, fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: brand.muted, fontSize: 12 }}
            />
            <Tooltip content={<Tip />} cursor={{ stroke: brand.blue300, strokeDasharray: '4 4' }} />
            <Legend verticalAlign="top" align="right" iconType="circle" height={32} />
            <Area
              dataKey="sends"
              name={names.sends}
              stroke={brand.blue900}
              strokeWidth={2.5}
              fill="url(#sendsFill)"
              isAnimationActive={false}
            />
            <Line
              dataKey="clicked"
              name={names.clicked}
              stroke={brand.blue500}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="completed"
              name={names.completed}
              stroke={brand.cyan}
              strokeWidth={2.5}
              strokeDasharray="2 4"
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Details>
        <summary>{t('common.show_table')}</summary>
        <TableScroll>
          <Table aria-label={t('overview.daily')} size="small">
            <Head>
              <HeaderRow>
                <HeaderCell>{t('overview.date')}</HeaderCell>
                {Object.values(names).map((n) => (
                  <HeaderCell key={n}>{n}</HeaderCell>
                ))}
              </HeaderRow>
            </Head>
            <Body>
              {data.map((d) => (
                <Row key={d.date}>
                  <Cell>{d.label}</Cell>
                  <Cell>{formatNumber(d.sends)}</Cell>
                  <Cell>{formatNumber(d.clicked)}</Cell>
                  <Cell>{formatNumber(d.completed)}</Cell>
                </Row>
              ))}
            </Body>
          </Table>
        </TableScroll>
      </Details>
    </Card>
  )
}

function Breakdown({ title, rows, nameOf }) {
  const { t } = useI18n()
  if (!rows?.length) return null
  const max = Math.max(1, ...rows.map((r) => r.sends))
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardHint>{t('overview.breakdown_hint')}</CardHint>
      <Rows>
        {rows.map((r) => (
          <li key={nameOf(r).key}>
            <RowHead>
              <span>{nameOf(r).text}</span>
              <span>{formatNumber(r.sends)}</span>
            </RowHead>
            <Track aria-hidden="true">
              <Fill style={{ width: `${(r.sends / max) * 100}%` }} />
            </Track>
            <Sub>
              {t('overview.cards.click_rate')}: {formatRate(r.click_rate)} · {t('overview.cards.completed')}:{' '}
              {formatNumber(r.completed)} ({formatRate(r.completion_rate_of_sent)})
            </Sub>
          </li>
        ))}
      </Rows>
      <Details>
        <summary>{t('common.show_table')}</summary>
        <TableScroll>
          <Table aria-label={title} size="small">
            <Head>
              <HeaderRow>
                <HeaderCell>{t('overview.name')}</HeaderCell>
                <HeaderCell>{t('overview.cards.sends')}</HeaderCell>
                <HeaderCell>{t('overview.cards.clicked')}</HeaderCell>
                <HeaderCell>{t('overview.cards.click_rate')}</HeaderCell>
                <HeaderCell>{t('overview.cards.completed')}</HeaderCell>
                <HeaderCell>{t('overview.cards.completion_of_sent')}</HeaderCell>
              </HeaderRow>
            </Head>
            <Body>
              {rows.map((r) => (
                <Row key={nameOf(r).key}>
                  <Cell>{nameOf(r).text}</Cell>
                  <Cell>{formatNumber(r.sends)}</Cell>
                  <Cell>{formatNumber(r.clicked)}</Cell>
                  <Cell>{formatRate(r.click_rate)}</Cell>
                  <Cell>{formatNumber(r.completed)}</Cell>
                  <Cell>{formatRate(r.completion_rate_of_sent)}</Cell>
                </Row>
              ))}
            </Body>
          </Table>
        </TableScroll>
      </Details>
    </Card>
  )
}

export default function Overview({ params }) {
  const { t } = useI18n()
  const label = useLabel()
  const query = useApiQuery('/summary', params)
  const c = (key) => t(`overview.cards.${key}`)
  return (
    <Stack>
      <QueryBoundary query={query} isEmpty={(d) => d.totals.sends === 0} emptyText={t('overview.empty')} lines={6}>
        {({ totals, daily, by_flow: byFlow, by_brand: byBrand }) => (
          <>
            <Kpis>
              <KpiCard
                hero
                icon="send"
                label={c('sends')}
                value={formatNumber(totals.sends)}
                details={[{ label: c('send_failed'), value: formatNumber(totals.send_failed) }]}
              />
              <KpiCard
                icon="click"
                label={c('click_rate')}
                value={formatRate(totals.click_rate)}
                details={[
                  { label: c('clicked'), value: formatNumber(totals.clicked) },
                  { label: c('not_clicked'), value: formatNumber(totals.not_clicked) }
                ]}
              />
              <KpiCard
                icon="check"
                label={c('completed')}
                value={formatNumber(totals.completed)}
                details={[
                  { label: c('completion_of_clicked'), value: formatRate(totals.completion_rate_of_clicked) },
                  { label: c('completion_of_sent'), value: formatRate(totals.completion_rate_of_sent) }
                ]}
              />
              <KpiCard
                icon="headset"
                label={c('handoff')}
                value={formatNumber(totals.handoff)}
                details={[
                  { label: c('errors'), value: formatNumber(totals.errors) },
                  { label: c('not_eligible'), value: formatNumber(totals.not_eligible) }
                ]}
              />
            </Kpis>
            <Split>
              <DailyChart daily={daily} />
              <Stack>
                <Breakdown
                  title={t('overview.by_flow')}
                  rows={byFlow}
                  nameOf={(r) => ({ key: r.flow, text: label('flows', r.flow) })}
                />
                <Breakdown
                  title={t('overview.by_brand')}
                  rows={byBrand}
                  nameOf={(r) => ({ key: r.brand, text: label('brands', r.brand) })}
                />
              </Stack>
            </Split>
          </>
        )}
      </QueryBoundary>
    </Stack>
  )
}
