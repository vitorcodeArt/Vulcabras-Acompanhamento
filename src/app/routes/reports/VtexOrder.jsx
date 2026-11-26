import { Button } from '@zendeskgarden/react-buttons'
import styled from 'styled-components'
import { useI18n } from '../../hooks/useI18n'
import { useApiQuery } from '../../../api/hooks'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../../lib/format'
import { Card, CardTitle } from '../../components/Card'
import CopyButton from '../../components/CopyButton'
import ErrorState from '../../components/ErrorState'
import Icon from '../../components/Icon'
import LoadingState from '../../components/LoadingState'

const Body = styled.div`
  display: grid;
  gap: 16px;
  margin-top: 12px;
`

const Note = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 12px 14px;
  font-size: 14px;
  border-radius: ${(p) => p.theme.brand.radiusSm};
  background: ${(p) => (p.$warning ? '#fff1d6' : p.theme.brand.blue50)};
  color: ${(p) => (p.$warning ? '#7a4600' : p.theme.brand.blue900)};
  svg {
    flex: none;
    margin-top: 2px;
  }
`

const Facts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px 24px;
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
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    overflow-wrap: anywhere;
  }
`

const Products = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 12px;
`

const Product = styled.li`
  display: flex;
  gap: 14px;
  padding: 12px;
  border: 1px solid ${(p) => p.theme.brand.line};
  border-radius: ${(p) => p.theme.brand.radiusSm};
  img,
  .placeholder {
    flex: none;
    width: 96px;
    height: 96px;
    object-fit: contain;
    border-radius: 8px;
    background: ${(p) => p.theme.brand.blue50};
  }
  div {
    min-width: 0;
    display: grid;
    gap: 2px;
    align-content: start;
    font-size: 13px;
    color: ${(p) => p.theme.brand.muted};
  }
  strong {
    font-size: 14px;
    color: ${(p) => p.theme.brand.text};
  }
  b {
    font-size: 15px;
    color: ${(p) => p.theme.brand.text};
  }
  s {
    margin-right: 6px;
  }
`

const Section = styled.h3`
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => p.theme.brand.text};
`

const TrackLink = styled.a`
  color: ${(p) => p.theme.brand.blue700};
  text-decoration: underline;
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

const https = (url) => (typeof url === 'string' && url.startsWith('https://') ? url : null)

function Fact({ term, children }) {
  if (children === null || children === undefined || children === '' || children === '–') return null
  return (
    <div>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function ProductCard({ item }) {
  const { t } = useI18n()
  const image = https(item.image_url)
  const discounted = Number.isFinite(item.list_price_cents) && item.list_price_cents > item.price_cents
  return (
    <Product>
      {image ? (
        <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="placeholder" aria-hidden="true" />
      )}
      <div>
        <strong>{item.name ?? '–'}</strong>
        {item.variation && (
          <span>
            {t('vtex.variation')}: {item.variation}
          </span>
        )}
        {item.ref_id && (
          <span>
            {t('vtex.reference')}: {item.ref_id}
          </span>
        )}
        <span>
          {t('vtex.quantity')}: {formatNumber(item.quantity)}
        </span>
        <span>
          {discounted && (
            <s>
              <span className="sr-only">{t('vtex.list_price')} </span>
              {formatMoney(item.list_price_cents)}
            </s>
          )}
          <b>{formatMoney(item.price_cents)}</b>
        </span>
      </div>
    </Product>
  )
}

function OrderBody({ order }) {
  const { t } = useI18n()
  const { totals = {}, shipping = {} } = order
  const packages = order.packages ?? []
  const payments = (order.payments ?? [])
    .filter((p) => p.method)
    .map((p) => (p.installments ? `${p.method} · ${p.installments}x` : p.method))
    .join(', ')

  return (
    <>
      <Facts>
        <Fact term={t('vtex.order')}>
          {order.order_id && (
            <>
              <span>{order.order_id}</span>
              <CopyButton text={order.order_id} label={t('journey.copy_order', { id: order.order_id })} />
            </>
          )}
        </Fact>
        <Fact term={t('vtex.status')}>{order.status_label ?? order.status}</Fact>
        <Fact term={t('vtex.created')}>{formatDateTime(order.created_at)}</Fact>
        <Fact term={t('vtex.invoiced')}>{formatDateTime(order.invoiced_at)}</Fact>
        <Fact term={t('vtex.payment')}>{payments}</Fact>
      </Facts>

      {order.items?.length > 0 && (
        <section>
          <Section>{t('vtex.products')}</Section>
          <Products>
            {order.items.map((item, i) => (
              <ProductCard key={`${item.ref_id ?? ''}-${i}`} item={item} />
            ))}
          </Products>
        </section>
      )}

      <section>
        <Section>{t('vtex.values')}</Section>
        <Facts>
          <Fact term={t('vtex.items_total')}>{formatMoney(totals.items_cents)}</Fact>
          <Fact term={t('vtex.discounts')}>{formatMoney(totals.discounts_cents)}</Fact>
          <Fact term={t('vtex.shipping_total')}>{formatMoney(totals.shipping_cents)}</Fact>
          <Fact term={t('vtex.total')}>{formatMoney(totals.total_cents)}</Fact>
        </Facts>
      </section>

      <section>
        <Section>{t('vtex.delivery')}</Section>
        <Facts>
          <Fact term={t('vtex.courier')}>{shipping.courier}</Fact>
          <Fact term={t('vtex.method')}>{shipping.method}</Fact>
          <Fact term={t('vtex.estimate')}>{formatDate(shipping.estimate_at)}</Fact>
          {packages.map((p, i) => (
            <Fact key={p.tracking_number ?? i} term={t('vtex.tracking')}>
              {p.tracking_number}
              {https(p.tracking_url) && (
                <TrackLink href={p.tracking_url} target="_blank" rel="noopener noreferrer">
                  {t('vtex.track')}
                </TrackLink>
              )}
              {p.delivered_at && <span>({t('vtex.delivered', { date: formatDate(p.delivered_at) })})</span>}
            </Fact>
          ))}
        </Facts>
      </section>
    </>
  )
}

const REASONS = ['no_order_number', 'not_found', 'not_configured', 'forbidden', 'unavailable']

/** Pedido na VTEX (`/sends/:sendId/order`). Carrega à parte: a VTEX lenta não trava a jornada. */
export default function VtexOrder({ sendId }) {
  const { t } = useI18n()
  const query = useApiQuery(`/sends/${encodeURIComponent(sendId)}/order`, undefined, { staleTime: 5 * 60_000 })
  const data = query.data?.data
  // Backend antigo, sem esta rota
  const missingRoute = query.error?.kind === 'not_found'

  return (
    <Card>
      <CardTitle>{t('vtex.title')}</CardTitle>
      <Body>
        {missingRoute && <Note role="status">{t('vtex.reasons.route_missing')}</Note>}
        {query.error && !missingRoute && !query.isFetching && (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
        {(query.isPending || (query.error && query.isFetching)) && <LoadingState lines={3} label={t('vtex.loading')} />}

        {data && !data.order && (
          <>
            <Note role="status">
              <Icon name="info" size={16} />
              <span>{t(`vtex.reasons.${REASONS.includes(data.reason) ? data.reason : 'unavailable'}`)}</span>
            </Note>
            {data.reason === 'unavailable' && (
              <div>
                <Button size="small" onClick={() => query.refetch()}>
                  {t('errors.retry')}
                </Button>
              </div>
            )}
          </>
        )}

        {data?.order && (
          <>
            {data.order_verified === false && (
              <Note $warning role="alert">
                <Icon name="alert" size={16} />
                <span>{t('vtex.unverified')}</span>
              </Note>
            )}
            <OrderBody order={data.order} />
          </>
        )}
      </Body>
    </Card>
  )
}
