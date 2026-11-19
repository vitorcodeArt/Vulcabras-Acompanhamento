import FilterSelect from './FilterSelect'
import styled from 'styled-components'
import { useI18n } from '../hooks/useI18n'
import { useLabel } from '../hooks/useLabel'

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
`

const BRANDS = ['mizuno', 'olympikus', 'underarmour']
const FLOWS = ['catalog', 'reverse', 'tracking']

/** Marca (+ fluxo). `filters` = { period, brand, flow }; o período fica no cabeçalho. */
export default function FiltersBar({ filters, onChange, showFlow = true }) {
  const { t } = useI18n()
  const label = useLabel()
  const set = (patch) => onChange({ ...filters, ...patch })
  return (
    <Bar role="search" aria-label={t('filters.title')}>
      <FilterSelect
        label={t('filters.brand')}
        value={filters.brand}
        onChange={(brand) => set({ brand })}
        options={BRANDS.map((k) => [k, label('brands', k)])}
        allLabel={t('filters.all_brands')}
      />
      {showFlow && (
        <FilterSelect
          label={t('filters.flow')}
          value={filters.flow}
          onChange={(flow) => set({ flow })}
          options={FLOWS.map((k) => [k, label('flows', k)])}
          allLabel={t('filters.all_flows')}
        />
      )}
    </Bar>
  )
}
