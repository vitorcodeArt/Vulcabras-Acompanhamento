import styled from 'styled-components'
import Icon from './Icon'

const Box = styled.div`
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
  color: ${(p) => p.theme.brand.muted};
  background: ${(p) => p.theme.brand.card};
  border: 1px dashed ${(p) => p.theme.brand.line};
  border-radius: ${(p) => p.theme.brand.radius};
`

const Badge = styled.span`
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: ${(p) => p.theme.brand.blue100};
  color: ${(p) => p.theme.brand.blue700};
`

export default function EmptyState({ children }) {
  return (
    <Box role="status">
      <Badge>
        <Icon name="chart" size={22} />
      </Badge>
      <span>{children}</span>
    </Box>
  )
}
