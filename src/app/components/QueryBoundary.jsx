import { useI18n } from '../hooks/useI18n'
import ErrorState from './ErrorState'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'

/**
 * Unifica carregamento (skeleton), erro (com "Tentar de novo") e vazio.
 * `children(data, meta)` recebe o conteúdo do contrato já sem o envelope.
 */
export default function QueryBoundary({ query, isEmpty, emptyText, lines = 4, children }) {
  const { t } = useI18n()
  const { data, error, isPending, isFetching, refetch } = query

  if (error && !isFetching) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isPending || error) return <LoadingState lines={lines} label={t('common.loading')} />
  if (isEmpty?.(data.data)) return <EmptyState>{emptyText ?? t('common.empty')}</EmptyState>
  return children(data.data, data.meta)
}
