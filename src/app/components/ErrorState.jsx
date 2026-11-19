import { Alert, Title } from '@zendeskgarden/react-notifications'
import { Button } from '@zendeskgarden/react-buttons'
import styled from 'styled-components'
import { useI18n } from '../hooks/useI18n'
import { ERROR_KINDS } from '../../api/errors'

const Actions = styled.div`
  margin-top: ${(p) => p.theme.space.sm};
`

/** Alerta com ícone + texto e botão "Tentar de novo". `error` é um ApiError. */
export default function ErrorState({ error, onRetry }) {
  const { t } = useI18n()
  const kind = error?.kind && ERROR_KINDS_SET.has(error.kind) ? error.kind : ERROR_KINDS.UNKNOWN
  // Para 400/404 o contrato manda um texto curto em português; nos demais usamos o texto fixo da interface.
  const useServerText = (kind === ERROR_KINDS.BAD_REQUEST || kind === ERROR_KINDS.NOT_FOUND) && error?.serverMessage
  const message = useServerText ? error.serverMessage : t(`errors.${kind}`)

  return (
    <Alert type={kind === ERROR_KINDS.WAKING ? 'warning' : 'error'} role="alert">
      <Title>{message}</Title>
      {onRetry && (
        <Actions>
          <Button size="small" onClick={onRetry}>
            {t('errors.retry')}
          </Button>
        </Actions>
      )}
    </Alert>
  )
}

const ERROR_KINDS_SET = new Set(Object.values(ERROR_KINDS))
