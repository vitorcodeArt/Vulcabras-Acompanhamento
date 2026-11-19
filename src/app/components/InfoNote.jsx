import styled from 'styled-components'
import Icon from './Icon'

const Note = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px 16px;
  border-radius: ${(p) => p.theme.brand.radiusSm};
  background: ${(p) => p.theme.brand.blue50};
  border: 1px solid ${(p) => p.theme.brand.blue100};
  color: ${(p) => p.theme.brand.blue900};
  font-size: 14px;
  svg {
    flex: none;
    margin-top: 1px;
  }
`

export default function InfoNote({ children }) {
  return (
    <Note>
      <Icon name="alert" size={18} />
      <span>{children}</span>
    </Note>
  )
}
