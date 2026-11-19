import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@zendeskgarden/react-buttons'
import styled from 'styled-components'
import { useApi } from '../hooks/useApi'
import { useI18n } from '../hooks/useI18n'
import { downloadTextFile } from '../../lib/download'
import ErrorState from './ErrorState'
import Icon from './Icon'

const Wrap = styled.div`
  display: grid;
  gap: 6px;
  justify-items: start;
`

const Caption = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.brand.muted};
`

// Nome do arquivo por relatório do contrato.
const FILE_PREFIX = { sends: 'envios', reverse_sessions: 'troca-devolucao', catalog_products: 'catalogo' }

/**
 * Baixa `/export.csv` como texto e entrega como arquivo. O contrato só aceita
 * report, from, to, brand e flow: nenhum outro filtro é enviado.
 */
export default function ExportButton({ report, params, hint }) {
  const { api } = useApi()
  const { t } = useI18n()
  const [done, setDone] = useState(false)

  const query = { report, from: params.from, to: params.to, brand: params.brand, flow: params.flow }
  const mutation = useMutation({
    mutationFn: () => api.getText('/export.csv', query),
    onSuccess: (text) => {
      downloadTextFile(`${FILE_PREFIX[report]}_${params.from}_a_${params.to}.csv`, text)
      setDone(true)
    }
  })

  useEffect(() => {
    if (!done) return undefined
    const timer = setTimeout(() => setDone(false), 4000)
    return () => clearTimeout(timer)
  }, [done])

  const run = () => {
    setDone(false)
    mutation.mutate()
  }

  return (
    <Wrap>
      <Button
        size="small"
        onClick={run}
        disabled={mutation.isPending}
        aria-describedby={hint ? `hint-${report}` : undefined}
      >
        <Button.StartIcon>
          <Icon name="download" size={14} />
        </Button.StartIcon>
        {mutation.isPending ? t('export.busy') : t('export.button')}
      </Button>
      {hint && <Caption id={`hint-${report}`}>{hint}</Caption>}
      <span className="sr-only" role="status">
        {done ? t('export.done') : ''}
      </span>
      {done && <Caption aria-hidden="true">{t('export.done')}</Caption>}
      {mutation.isError && <ErrorState error={mutation.error} onRetry={run} />}
    </Wrap>
  )
}
