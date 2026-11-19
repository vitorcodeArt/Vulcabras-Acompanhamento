import { Field, Label, Select } from '@zendeskgarden/react-forms'
import styled from 'styled-components'

const Wrap = styled.div`
  select {
    border-radius: 999px;
    background-color: ${(p) => p.theme.brand.card};
    border-color: ${(p) => p.theme.brand.line};
    min-width: 11rem;
  }
`

/** Select nativo do Garden em formato de pílula, com rótulo só para leitor de tela. */
export default function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <Wrap>
      <Field>
        <Label hidden>{label}</Label>
        <Select isCompact value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
          <option value="">{allLabel}</option>
          {options.map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </Select>
      </Field>
    </Wrap>
  )
}
