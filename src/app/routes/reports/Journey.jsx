import { Button } from '@zendeskgarden/react-buttons'
import styled, { css } from 'styled-components'
import { useI18n } from '../../hooks/useI18n'
import { useLabel } from '../../hooks/useLabel'
import { useApiQuery } from '../../../api/hooks'
import { formatDateTime, formatDuration, formatTime } from '../../../lib/format'
import { Card, CardTitle } from '../../components/Card'
import CopyButton from '../../components/CopyButton'
import ErrorState from '../../components/ErrorState'
import Icon from '../../components/Icon'
import LoadingState from '../../components/LoadingState'
import { ClickChip, SituationChip } from '../../components/StatusChip'
import TicketLink from '../../components/TicketLink'
import { lastStepText, resultText } from './sendFields'

const Stack = styled.div`
  display: grid;
  gap: 20px;
`

const Facts = styled.dl`
  margin: 16px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px 24px;
  dt {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${(p) => p.theme.brand.muted};
  }
  dd {
    margin: 4px 0 0;
    font-weight: 600;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`

const Notice = styled.p`
  margin: 0;
  padding: 16px;
  border-radius: ${(p) => p.theme.brand.radiusSm};
  background: ${(p) => p.theme.brand.blue50};
  color: ${(p) => p.theme.brand.blue900};
`

const Timeline = styled.ol`
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
`

const Event = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 16px;
  padding-bottom: 20px;
  &::before {
    content: '';
    position: absolute;
    left: calc(5.5rem + 16px + 7px);
    top: 20px;
    bottom: 0;
    width: 2px;
    background: ${(p) => p.theme.brand.line};
  }
  &:last-child::before {
    display: none;
  }
  @media (max-width: 560px) {
    grid-template-columns: 4.5rem 1fr;
    &::before {
      left: calc(4.5rem + 16px + 7px);
    }
  }
`

const Time = styled.time`
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
  padding-top: 2px;
`

const Dot = styled.span`
  position: absolute;
  left: calc(5.5rem + 16px);
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${(p) => (p.$error ? p.theme.brand.danger : p.theme.brand.blue700)};
  border: 3px solid ${(p) => p.theme.brand.card};
  box-shadow: 0 0 0 1px ${(p) => (p.$error ? p.theme.brand.danger : p.theme.brand.blue300)};
  @media (max-width: 560px) {
    left: calc(4.5rem + 16px);
  }
`

const Content = styled.div`
  padding-left: 28px;
  display: grid;
  gap: 4px;
  min-width: 0;
`

const Step = styled.span`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(p) => p.theme.brand.blue700};
`

const What = styled.span`
  font-weight: 600;
  color: ${(p) => p.theme.brand.text};
`

const Sub = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
`

const ErrorBox = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-self: start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  ${(p) => css`
    background: #fde8e6;
    color: ${p.theme.brand.danger};
  `}
`

function Fact({ term, children }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Detalhe de um envio (`/sends/:sendId`): cabeçalho e linha do tempo da sessão. */
export default function Journey({ sendId, onBack }) {
  const { t } = useI18n()
  const label = useLabel()
  const query = useApiQuery(`/sends/${encodeURIComponent(sendId)}`)
  const item = query.data?.data

  return (
    <Stack>
      <div>
        <Button size="small" onClick={onBack}>
          <Button.StartIcon>
            <Icon name="back" size={14} />
          </Button.StartIcon>
          {t('journey.back')}
        </Button>
      </div>

      {query.error && !query.isFetching && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {(query.isPending || (query.error && query.isFetching)) && <LoadingState lines={6} label={t('common.loading')} />}

      {item && (
        <>
          <Card>
            <CardTitle id="journey-title">{t('journey.title')}</CardTitle>
            <Chips>
              <ClickChip item={item} />
              <SituationChip item={item} />
            </Chips>
            <Facts>
              <Fact term={t('sends.columns.customer')}>{item.customer_name ?? '–'}</Fact>
              <Fact term={t('sends.columns.conversation')}>
                <span>{item.conversation_id}</span>
                <CopyButton text={item.conversation_id} label={t('sends.copy', { id: item.conversation_id })} />
              </Fact>
              <Fact term={t('sends.columns.brand')}>{label('brands', item.brand)}</Fact>
              <Fact term={t('sends.columns.flow')}>{label('flows', item.flow)}</Fact>
              <Fact term={t('sends.columns.datetime')}>{formatDateTime(item.sent_at)}</Fact>
              <Fact term={t('sends.columns.last_step')}>{lastStepText(item, label)}</Fact>
              <Fact term={t('sends.columns.result')}>{resultText(item, t)}</Fact>
              {item.reason && <Fact term={t('journey.reason')}>{item.reason}</Fact>}
              <Fact term={t('sends.columns.ticket')}>
                <TicketLink id={item.ticket_id} />
              </Fact>
            </Facts>
          </Card>

          <Card>
            <CardTitle id="timeline-title">{t('journey.timeline')}</CardTitle>
            {item.events?.length ? (
              <Timeline aria-label={t('journey.timeline')}>
                {item.events.map((event) => (
                  <Event key={event.id}>
                    <Time dateTime={event.ts}>{formatTime(event.ts)}</Time>
                    <Dot $error={Boolean(event.error_code)} aria-hidden="true" />
                    <Content>
                      {event.step_label && <Step>{event.step_label}</Step>}
                      <What>{event.event_label}</What>
                      {event.duration_ms != null && (
                        <Sub>
                          {t('journey.time_in_step')}: {formatDuration(event.duration_ms / 1000)}
                        </Sub>
                      )}
                      {event.meta?.reason && (
                        <Sub>
                          {t('journey.reason')}: {event.meta.reason}
                        </Sub>
                      )}
                      {event.error_code && (
                        <ErrorBox>
                          <Icon name="alert" size={14} />
                          {t('journey.error')}: {event.error_label ?? event.error_code}
                        </ErrorBox>
                      )}
                    </Content>
                  </Event>
                ))}
              </Timeline>
            ) : (
              <Notice role="status">
                {item.click_status === 'send_failed'
                  ? t('journey.send_failed', { date: formatDateTime(item.sent_at) })
                  : t('journey.no_click', { date: formatDateTime(item.sent_at) })}
              </Notice>
            )}
          </Card>
        </>
      )}
    </Stack>
  )
}
