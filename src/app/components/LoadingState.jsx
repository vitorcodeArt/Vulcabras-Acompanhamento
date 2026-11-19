import { Skeleton } from '@zendeskgarden/react-loaders'
import { Alert, Title } from '@zendeskgarden/react-notifications'
import styled from 'styled-components'
import { useI18n } from '../hooks/useI18n'
import { useSlow } from '../hooks/useSlow'

const Stack = styled.div`
  display: grid;
  gap: ${(p) => p.theme.space.xs};
`

/** Skeleton; depois de alguns segundos avisa que o servidor pode estar acordando. */
export default function LoadingState({ lines = 3, label }) {
  const { t } = useI18n()
  const slow = useSlow(true)
  return (
    <Stack role="status" aria-live="polite" aria-label={label ?? t('common.loading')}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height="1.5em" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
      {slow && (
        <Alert type="warning">
          <Title>{t('errors.waking')}</Title>
        </Alert>
      )}
    </Stack>
  )
}
