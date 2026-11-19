import styled from 'styled-components'

export const ReportStack = styled.div`
  display: grid;
  gap: 20px;
`

export const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
`

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: 20px;
  align-items: start;
`
