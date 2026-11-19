import styled from 'styled-components'

export const Card = styled.section`
  background: ${(p) => p.theme.brand.card};
  border: 1px solid ${(p) => p.theme.brand.line};
  border-radius: ${(p) => p.theme.brand.radius};
  box-shadow: ${(p) => p.theme.brand.shadow};
  padding: 20px;
  min-width: 0;
`

export const CardTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => p.theme.brand.text};
`

export const CardHint = styled.p`
  margin: 0 0 16px;
  font-size: 13px;
  color: ${(p) => p.theme.brand.muted};
`
