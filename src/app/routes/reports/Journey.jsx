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
import { INELIGIBLE_ERROR_CODES, diagnose, metaDetails } from './diagnosis'
import VtexOrder from './VtexOrder'

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

const Unverified = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: #fff1d6;
  color: #7a4600;
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
    background: ${p.$refusal ? p.theme.brand.blue100 : '#fde8e6'};
    color: ${p.$refusal ? p.theme.brand.blue900 : p.theme.brand.danger};
  `}
`

// [fundo, texto, borda]: o ícone e o título dizem o mesmo que a cor
const TONES = {
  info: ['#E3EDFD', '#0F3B8C', '#1556C0'],
  warning: ['#FFF1D6', '#7A4600', '#B26A00'],
  danger: ['#FDE8E6', '#8C1D18', '#B3261E']
}

const Finding = styled.li`
  list-style: none;
  padding: 14px 16px;
  display: grid;
  gap: 8px;
  border-radius: ${(p) => p.theme.brand.radiusSm};
  ${(p) => css`
    background: ${TONES[p.$tone][0]};
    color: ${TONES[p.$tone][1]};
    border-left: 5px solid ${TONES[p.$tone][2]};
  `}
`

const FindingTitle = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
`

const FindingText = styled.p`
  margin: 0;
  font-size: 14px;
  overflow-wrap: anywhere;
`

const FindingLines = styled.dl`
  margin: 8px 0 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 16px;
  font-size: 13px;
  dt {
    opacity: 0.85;
  }
  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
`

const Technical = styled.details`
  font-size: 13px;
  summary {
    cursor: pointer;
    text-decoration: underline;
  }
  summary:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
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

/** Detalhes do `meta` de um evento, recolhidos: rótulo em português e dados sensíveis mascarados. */
function EventDetails({ event, helpers }) {
  const { rows, other } = metaDetails(event.meta, helpers)
  const all = [...rows, ...other]
  if (!all.length) return null
  return (
    <More>
      <summary>{helpers.t('diag.technical')}</summary>
      <DetailChips>
        {all.map((row) => (
          <Chip key={row.id}>
            {row.label}: <strong>{row.value}</strong>
          </Chip>
        ))}
      </DetailChips>
    </More>
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
                <Fact term={item.order_verified === false ? t('journey.order_typed') : t('journey.order')}>
                  <span>{item.order_number}</span>
                  <CopyButton text={item.order_number} label={t('journey.copy_order', { id: item.order_number })} />
                  {item.order_verified === false && (
                    <Unverified>
                      <Icon name="alert" size={14} />
                      {t('journey.order_unverified')}
                    </Unverified>
                  )}
                </Fact>
              )}
              <Fact term={t('sends.columns.ticket')}>
                <TicketLink id={item.ticket_id} />
              </Fact>
            </Facts>
            {item.order_number && item.order_verified === false && <Hint>{t('journey.order_unverified_hint')}</Hint>}
            {item.items?.length > 0 && (
              <>
                <Hint>{t('journey.chosen_products')}</Hint>
                <Items aria-label={t('journey.products')}>
                  {item.items.map((it, i) => (
                    <ItemLine key={`${it.sku ?? i}`} item={it} />
                  ))}
                </Items>
              </>
            )}
          </Card>

          {item.flow === 'reverse' && item.order_number && <VtexOrder sendId={item.send_id} />}

          {findings.length > 0 && (
            <Card>
              <CardTitle id="diagnosis-title">{t('diag.title')}</CardTitle>
              <Hint>{t('diag.hint')}</Hint>
              <Findings aria-labelledby="diagnosis-title">
                {findings.map((finding) => (
                  <Finding key={finding.id} $tone={finding.tone}>
                    <FindingTitle>
                      <Icon name={finding.tone === 'info' ? 'info' : 'alert'} size={18} />
                      {finding.title}
                    </FindingTitle>
                    {finding.message && (
                      <FindingText>
                        <strong>{t('diag.message')}:</strong> {finding.message}
                      </FindingText>
                    )}
                    <FindingText>
                      <strong>{t('diag.guidance')}:</strong> {finding.guidance}
                    </FindingText>
                    {finding.technical.length > 0 && (
                      <Technical>
                        <summary>{t('diag.technical')}</summary>
                        <FindingLines>
                          {finding.technical.map((l) => (
                            <div key={l.id} style={{ display: 'contents' }}>
                              <dt>{l.label}</dt>
                              <dd>{l.value}</dd>
                            </div>
                          ))}
                        </FindingLines>
                      </Technical>
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
                {item.events.map((event) => {
                  // Recusa por regra de negócio é um aviso, não um erro
                  const refusal =
                    event.event === 'error_shown' &&
                    (INELIGIBLE_ERROR_CODES.includes(event.error_code) || item.session_status === 'not_eligible')
                  return (
                    <Event key={event.id}>
                      <Time dateTime={event.ts}>{formatTime(event.ts)}</Time>
                      <Dot $error={Boolean(event.error_code) && !refusal} aria-hidden="true" />
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
                          <ErrorBox $refusal={refusal}>
                            <Icon name={refusal ? 'info' : 'alert'} size={14} />
                            {refusal ? t('diag.notice') : t('journey.error')}: {event.error_label ?? event.error_code}
                          </ErrorBox>
                        )}
                        <EventDetails event={event} helpers={helpers} />
                      </Content>
                    </Event>
                  )
                })}
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
