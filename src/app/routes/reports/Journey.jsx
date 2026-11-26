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
import { diagnose, metaDetails } from './diagnosis'

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

const TONES = {
  danger: ['#FDE8E6', '#8C1D18', '#B3261E'],
  warning: ['#FFF1D6', '#7A4600', '#B26A00']
}

const Finding = styled.li`
  list-style: none;
  padding: 14px 16px;
  border-radius: ${(p) => p.theme.brand.radiusSm};
  ${(p) => css`
    background: ${TONES[p.$tone][0]};
    color: ${TONES[p.$tone][1]};
    border-left: 5px solid ${TONES[p.$tone][2]};
  `}
`

const FindingTitle = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`

const FindingLines = styled.dl`
  margin: 8px 0 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 16px;
  font-size: 14px;
  dt {
    opacity: 0.85;
  }
  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
`

const Findings = styled.ul`
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 12px;
`

const Hint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
`

const Chip = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  background: ${(p) => p.theme.brand.blue50};
  border: 1px solid ${(p) => p.theme.brand.blue100};
  color: ${(p) => p.theme.brand.text};
  overflow-wrap: anywhere;
  strong {
    font-weight: 600;
  }
`

const DetailChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`

const More = styled.details`
  font-size: 12px;
  color: ${(p) => p.theme.brand.muted};
  summary {
    cursor: pointer;
    color: ${(p) => p.theme.brand.blue700};
  }
  summary:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

/** Detalhes do `meta` de um evento, com rótulo em português e dados sensíveis mascarados. */
function EventDetails({ event, helpers }) {
  const { rows, other } = metaDetails(event.meta, helpers)
  if (!rows.length && !other.length) return null
  return (
    <>
      {rows.length > 0 && (
        <DetailChips>
          {rows.map((row) => (
            <Chip key={row.id}>
              {row.label}: <strong>{row.value}</strong>
            </Chip>
          ))}
        </DetailChips>
      )}
      {other.length > 0 && (
        <More>
          <summary>{helpers.t('journey.other_details')}</summary>
          <DetailChips>
            {other.map((row) => (
              <Chip key={row.id}>
                {row.label}: <strong>{row.value}</strong>
              </Chip>
            ))}
          </DetailChips>
        </More>
      )}
    </>
  )
}

const Items = styled.ul`
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 12px;
`

const ItemRow = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  img,
  .placeholder {
    width: 56px;
    height: 56px;
    flex: none;
    border-radius: ${(p) => p.theme.brand.radiusSm};
    border: 1px solid ${(p) => p.theme.brand.line};
    object-fit: cover;
    background: ${(p) => p.theme.brand.blue50};
  }
  strong {
    display: block;
  }
  span {
    font-size: 13px;
    color: ${(p) => p.theme.brand.muted};
  }
`

/** Produto escolhido pelo cliente; a imagem só aparece se o backend enviar `image_url` https. */
function ItemLine({ item }) {
  const safeImage = typeof item.image_url === 'string' && item.image_url.startsWith('https://')
  return (
    <ItemRow>
      {safeImage ? (
        <img src={item.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <div className="placeholder" aria-hidden="true" />
      )}
      <div>
        <strong>{item.title}</strong>
        <span>{[item.sku, item.size && `Tam. ${item.size}`].filter(Boolean).join(' · ')}</span>
      </div>
    </ItemRow>
  )
}

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
  const helpers = { t, label }
  const findings = item ? diagnose(item, item.events, helpers) : []

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
              {item.order_number && (
                <Fact term={t('journey.order')}>
                  <span>{item.order_number}</span>
                  <CopyButton text={item.order_number} label={t('sends.copy', { id: item.order_number })} />
                </Fact>
              )}
              <Fact term={t('sends.columns.ticket')}>
                <TicketLink id={item.ticket_id} />
              </Fact>
            </Facts>
            {item.items?.length > 0 && (
              <Items aria-label={t('journey.products')}>
                {item.items.map((it, i) => (
                  <ItemLine key={`${it.sku ?? i}`} item={it} />
                ))}
              </Items>
            )}
          </Card>

          {findings.length > 0 && (
            <Card>
              <CardTitle id="diagnosis-title">{t('diag.title')}</CardTitle>
              <Hint>{t('diag.hint')}</Hint>
              <Findings aria-labelledby="diagnosis-title">
                {findings.map((finding) => (
                  <Finding key={finding.id} $tone={finding.tone}>
                    <FindingTitle>
                      <Icon name="alert" size={18} />
                      {finding.title}
                    </FindingTitle>
                    {finding.lines.length > 0 && (
                      <FindingLines>
                        {finding.lines.map((l) => (
                          <div key={l.id} style={{ display: 'contents' }}>
                            <dt>{l.label}</dt>
                            <dd>{l.value}</dd>
                          </div>
                        ))}
                      </FindingLines>
                    )}
                  </Finding>
                ))}
              </Findings>
            </Card>
          )}

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
                      <EventDetails event={event} helpers={helpers} />
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
