import styled from 'styled-components'
import { useClient } from '../hooks/useClient'
import { useI18n } from '../hooks/useI18n'

const Link = styled.button`
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  color: ${(p) => p.theme.brand.blue700};
  text-decoration: underline;
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

/** Abre o ticket dentro da Zendesk; "–" quando não há ticket. */
export default function TicketLink({ id }) {
  const client = useClient()
  const { t } = useI18n()
  if (id == null) return <span>–</span>
  return (
    <Link
      type="button"
      aria-label={t('sends.open_ticket', { id: String(id) })}
      onClick={(event) => {
        event.stopPropagation()
        client.invoke('routeTo', 'ticket', id)
      }}
    >
      #{id}
    </Link>
  )
}
