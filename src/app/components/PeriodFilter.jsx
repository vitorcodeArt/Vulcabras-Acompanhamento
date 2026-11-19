import styled from 'styled-components'
import { useI18n } from '../hooks/useI18n'

export const PERIOD_OPTIONS = ['today', '7d', '30d']

const Group = styled.div`
  display: inline-flex;
  padding: 4px;
  gap: 2px;
  border-radius: 999px;
  background: ${(p) => p.theme.brand.card};
  border: 1px solid ${(p) => p.theme.brand.line};
`

const Option = styled.button`
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 999px;
  color: ${(p) => (p.$active ? '#fff' : p.theme.brand.muted)};
  background: ${(p) => (p.$active ? p.theme.brand.blue700 : 'transparent')};
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  &:hover:not([aria-pressed='true']) {
    background: ${(p) => p.theme.brand.blue50};
  }
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

/** Controle segmentado com aria-pressed: o ativo se destaca por fundo e peso, não só por cor. */
export default function PeriodFilter({ value, onChange }) {
  const { t } = useI18n()
  return (
    <Group role="group" aria-label={t('filters.period')}>
      {PERIOD_OPTIONS.map((key) => (
        <Option
          key={key}
          type="button"
          $active={value === key}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {t(`filters.periods.${key}`)}
        </Option>
      ))}
    </Group>
  )
}
