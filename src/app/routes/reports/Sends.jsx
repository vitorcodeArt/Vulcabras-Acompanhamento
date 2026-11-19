import { useState } from 'react'
import { Button } from '@zendeskgarden/react-buttons'
import { Input } from '@zendeskgarden/react-forms'
import { Body, Cell, Head, HeaderCell, HeaderRow, Row, Table } from '@zendeskgarden/react-tables'
import styled from 'styled-components'
import { useI18n } from '../../hooks/useI18n'
import { useLabel } from '../../hooks/useLabel'
import { useApiInfiniteQuery } from '../../../api/hooks'
import { formatDateTime, formatNumber } from '../../../lib/format'
import { Card } from '../../components/Card'
import CopyButton from '../../components/CopyButton'
import ExportButton from '../../components/ExportButton'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import FilterSelect from '../../components/FilterSelect'
import Icon from '../../components/Icon'
import LoadingState from '../../components/LoadingState'
import { ClickChip, SituationChip } from '../../components/StatusChip'
import TicketLink from '../../components/TicketLink'
import { lastStepText, resultText } from './sendFields'

const PAGE_SIZE = 50
const MIN_QUERY = 3

const Toolbar = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`

const SearchBox = styled.div`
  display: flex;
  gap: 8px;
  min-width: min(26rem, 100%);
  input {
    border-radius: 999px;
    flex: 1 1 auto;
    min-width: 22rem;
  }
`

const Export = styled.div`
  margin-left: auto;
  max-width: 18rem;
`

const Hint = styled.p`
  margin: 4px 12px 0;
  font-size: 12px;
  color: ${(p) => p.theme.brand.danger};
`

const Scroll = styled.div`
  overflow-x: auto;
  table {
    min-width: 1280px;
    table-layout: auto;
  }
  td,
  th {
    width: auto;
  }
`

const ClickableRow = styled(Row)`
  cursor: pointer;
  &:hover {
    background: ${(p) => p.theme.brand.blue50};
  }
`

const OpenButton = styled.button`
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: ${(p) => p.theme.brand.blue900};
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

const IdCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
`

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
`

const COLUMNS = [
  'datetime',
  'conversation',
  'customer',
  'brand',
  'flow',
  'click',
  'status',
  'last_step',
  'result',
  'ticket'
]
const CLICK_STATUSES = ['not_clicked', 'clicked', 'send_failed']
const STATUSES = ['completed', 'handoff', 'error', 'abandoned', 'in_progress']

export const openJourneyHash = (sendId) => `/envios/${encodeURIComponent(sendId)}`

/** Tela principal dos analistas: todo botão enviado e o que aconteceu depois. */
export default function Sends({ params, filters, onFiltersChange }) {
  const { t } = useI18n()
  const label = useLabel()
  const [text, setText] = useState(filters.q)
  const [tooShort, setTooShort] = useState(false)

  const query = useApiInfiniteQuery('/sends', {
    ...params,
    click_status: filters.clickStatus,
    status: filters.status,
    q: filters.q,
    limit: PAGE_SIZE
  })
  const items = query.data?.pages.flatMap((page) => page.data.items) ?? []

  const submit = (event) => {
    event.preventDefault()
    const q = text.trim()
    if (q && q.length < MIN_QUERY) return setTooShort(true)
    setTooShort(false)
    onFiltersChange({ ...filters, q })
  }
  const clear = () => {
    setText('')
    setTooShort(false)
    onFiltersChange({ ...filters, q: '' })
  }

  return (
    <Card aria-label={t('sends.title')}>
      <Toolbar onSubmit={submit} role="search" aria-label={t('sends.title')}>
        <div>
          <SearchBox>
            <Input
              isCompact
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('sends.search_placeholder')}
              aria-label={t('sends.search_label')}
              aria-invalid={tooShort}
            />
            <Button type="submit" isPrimary size="small">
              <Button.StartIcon>
                <Icon name="search" size={14} />
              </Button.StartIcon>
              {t('sends.search_button')}
            </Button>
            {(filters.q || text) && (
              <Button type="button" size="small" onClick={clear}>
                {t('sends.clear')}
              </Button>
            )}
          </SearchBox>
          {tooShort && <Hint role="alert">{t('sends.search_min')}</Hint>}
        </div>
        <FilterSelect
          label={t('sends.click_status')}
          value={filters.clickStatus}
          onChange={(clickStatus) => onFiltersChange({ ...filters, clickStatus })}
          options={CLICK_STATUSES.map((k) => [k, label('clickStatus', k)])}
          allLabel={t('sends.all_click_status')}
        />
        <FilterSelect
          label={t('sends.status')}
          value={filters.status}
          onChange={(status) => onFiltersChange({ ...filters, status })}
          options={STATUSES.map((k) => [k, label('status', k)])}
          allLabel={t('sends.all_status')}
        />
        <Export>
          <ExportButton report="sends" params={params} hint={t('export.sends_hint')} />
        </Export>
      </Toolbar>

      {!items.length && query.isError && !query.isFetching && (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      )}
      {!items.length && (query.isPending || (query.isError && query.isFetching)) && (
        <LoadingState lines={8} label={t('common.loading')} />
      )}
      {query.isSuccess && !items.length && <EmptyState>{t('sends.empty')}</EmptyState>}

      {items.length > 0 && (
        <>
          <Scroll tabIndex={0} role="region" aria-label={t('sends.table_region')}>
            <Table aria-label={t('sends.title')} size="small">
              <Head>
                <HeaderRow>
                  {COLUMNS.map((c) => (
                    <HeaderCell key={c}>{t(`sends.columns.${c}`)}</HeaderCell>
                  ))}
                </HeaderRow>
              </Head>
              <Body>
                {items.map((item) => (
                  <ClickableRow
                    key={item.send_id}
                    onClick={() => (window.location.hash = openJourneyHash(item.send_id))}
                  >
                    <Cell>
                      <OpenButton
                        type="button"
                        aria-label={t('sends.open_journey', { date: formatDateTime(item.sent_at) })}
                      >
                        {formatDateTime(item.sent_at)}
                      </OpenButton>
                    </Cell>
                    <Cell>
                      <IdCell>
                        {item.conversation_id}
                        <CopyButton text={item.conversation_id} label={t('sends.copy', { id: item.conversation_id })} />
                      </IdCell>
                    </Cell>
                    <Cell>{item.customer_name ?? '–'}</Cell>
                    <Cell>{label('brands', item.brand)}</Cell>
                    <Cell>{label('flows', item.flow)}</Cell>
                    <Cell>
                      <ClickChip item={item} />
                    </Cell>
                    <Cell>
                      <SituationChip item={item} />
                    </Cell>
                    <Cell>{lastStepText(item, label)}</Cell>
                    <Cell>{resultText(item, t)}</Cell>
                    <Cell>
                      <TicketLink id={item.ticket_id} />
                    </Cell>
                  </ClickableRow>
                ))}
              </Body>
            </Table>
          </Scroll>

          {query.isFetchNextPageError && <ErrorState error={query.error} onRetry={() => query.fetchNextPage()} />}
          <Footer>
            <span role="status">{t('sends.loaded', { n: formatNumber(items.length) })}</span>
            {query.hasNextPage && (
              <Button isPrimary onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage ? t('sends.loading_more') : t('sends.load_more')}
              </Button>
            )}
          </Footer>
        </>
      )}
    </Card>
  )
}
