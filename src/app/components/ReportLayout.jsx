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
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  gap: 20px;
  align-items: stretch;
`

/**
 * Envolve uma tabela do Garden: a tabela tem largura mínima e rola na horizontal
 * quando o cartão é estreito, em vez de uma coluna invadir a outra. A primeira
 * coluna (o nome) quebra linha; os números ficam inteiros.
 */
export const TableScroll = styled.div`
  max-width: 100%;
  overflow-x: auto;
  table {
    width: 100%;
    min-width: ${(p) => p.$minWidth ?? 0}px;
    font-size: 13px;
    table-layout: auto;
  }
  th,
  td {
    width: auto;
    overflow: visible;
    padding-inline: 6px;
    white-space: nowrap;
  }
  /* O cabeçalho pode quebrar em duas linhas; os números ficam inteiros */
  th {
    white-space: normal;
    vertical-align: bottom;
    line-height: 1.3;
  }
  /* O nome quebra entre palavras, nunca no meio delas */
  th:first-child,
  td:first-child {
    min-width: 5.5rem;
    white-space: normal;
    overflow-wrap: normal;
  }
`
