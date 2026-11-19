import styled from 'styled-components'
import { useI18n } from '../../hooks/useI18n'
import { useApiQuery } from '../../../api/hooks'
import { formatDuration, formatNumber, formatRate } from '../../../lib/format'
import QueryBoundary from '../../components/QueryBoundary'
import Icon from '../../components/Icon'
import { Card, CardHint, CardTitle } from '../../components/Card'

const List = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
`

const Item = styled.li`
  display: grid;
  grid-template-columns: minmax(7rem, 11rem) minmax(0, 1fr) 4.5rem 6rem 6rem;
  gap: 16px;
  align-items: center;
  font-size: 14px;
  @media (max-width: 760px) {
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid ${(p) => p.theme.brand.line};
  }
`

const Name = styled.span`
  font-weight: 600;
  color: ${(p) => p.theme.brand.text};
  @media (max-width: 760px) {
    grid-column: 1 / -1;
  }
`

const Track = styled.div`
  height: 28px;
  border-radius: 999px;
  background: ${(p) => p.theme.brand.blue50};
  @media (max-width: 760px) {
    grid-column: 1 / -1;
  }
`

const Bar = styled.div`
  min-width: 14px;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, ${(p) => p.theme.brand.blue900}, ${(p) => p.theme.brand.blue500});
`

const Num = styled.span`
  font-weight: 700;
  text-align: right;
  @media (max-width: 760px) {
    text-align: left;
  }
`

const Fact = styled.span`
  color: ${(p) => p.theme.brand.muted};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  small {
    font-size: 12px;
    display: none;
    @media (max-width: 760px) {
      display: inline;
    }
  }
`

const Drop = styled(Fact)`
  color: ${(p) => (p.$has ? p.theme.brand.danger : p.theme.brand.muted)};
  font-weight: 600;
`

const Header = styled.div`
  display: grid;
  grid-template-columns: minmax(7rem, 11rem) minmax(0, 1fr) 4.5rem 6rem 6rem;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
  color: ${(p) => p.theme.brand.muted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  span:nth-child(3) {
    text-align: right;
  }
  @media (max-width: 760px) {
    display: none;
  }
`

/** Funil de um fluxo (`reverse` ou `catalog`): quantidade, queda vs. etapa anterior e tempo médio. */
export default function Funnel({ flow, params }) {
  const { t } = useI18n()
  const query = useApiQuery('/funnel', { ...params, flow })
  return (
    <Card>
      <CardTitle id={`funnel-title-${flow}`}>{t('funnel.title')}</CardTitle>
      <CardHint>{t('funnel.hint')}</CardHint>
      <QueryBoundary
        query={query}
        isEmpty={(d) => !d.steps?.length || d.steps[0].sessions === 0}
        emptyText={t('funnel.empty')}
      >
        {({ steps }) => {
          const max = Math.max(1, steps[0].sessions)
          return (
            <>
              <Header aria-hidden="true">
                <span>{t('funnel.step')}</span>
                <span />
                <span>{t('funnel.sessions')}</span>
                <span>{t('funnel.drop_off')}</span>
                <span>{t('funnel.avg_time')}</span>
              </Header>
              <List aria-label={t('funnel.title')}>
                {steps.map((step) => (
                  <Item key={step.key}>
                    <Name>{step.label}</Name>
                    <Track aria-hidden="true">
                      <Bar style={{ width: `${(step.sessions / max) * 100}%` }} />
                    </Track>
                    <Num>
                      <small className="sr-only">{t('funnel.sessions')}: </small>
                      {formatNumber(step.sessions)}
                    </Num>
                    <Drop $has={step.drop_off_rate > 0}>
                      <small>{t('funnel.drop_off')}:</small>
                      {step.drop_off_rate > 0 && <Icon name="down" size={14} />}
                      {formatRate(step.drop_off_rate)}
                    </Drop>
                    <Fact>
                      <small>{t('funnel.avg_time')}:</small>
                      {formatDuration(step.avg_duration_ms == null ? null : step.avg_duration_ms / 1000)}
                    </Fact>
                  </Item>
                ))}
              </List>
            </>
          )
        }}
      </QueryBoundary>
    </Card>
  )
}
