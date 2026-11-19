import styled from 'styled-components'
import { useI18n } from '../hooks/useI18n'
import { formatNumber } from '../../lib/format'
import { Card, CardHint, CardTitle } from './Card'

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
`

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.brand.text};
  span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`

const Track = styled.div`
  margin: 6px 0 4px;
  height: 8px;
  border-radius: 999px;
  background: ${(p) => p.theme.brand.blue100};
  overflow: hidden;
`

const Fill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, ${(p) => p.theme.brand.blue900}, ${(p) => p.theme.brand.blue500});
`

const Sub = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
`

const Muted = styled.p`
  margin: 0;
  color: ${(p) => p.theme.brand.muted};
  font-size: 14px;
`

/**
 * Cartão com ranking em barras. `items`: [{ key, label, value, sub? }].
 * As barras são só visuais: o número e o texto de cada linha dizem o mesmo.
 */
export default function BarList({ title, hint, items, emptyText }) {
  const { t } = useI18n()
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {hint && <CardHint>{hint}</CardHint>}
      {!hint && <CardHint>&nbsp;</CardHint>}
      {items.length === 0 ? (
        <Muted>{emptyText ?? t('common.no_data')}</Muted>
      ) : (
        <List>
          {items.map((item) => (
            <li key={item.key}>
              <Head>
                <span>{item.label}</span>
                <span>{formatNumber(item.value)}</span>
              </Head>
              <Track aria-hidden="true">
                <Fill style={{ width: `${(item.value / max) * 100}%` }} />
              </Track>
              {item.sub && <Sub>{item.sub}</Sub>}
            </li>
          ))}
        </List>
      )}
    </Card>
  )
}
