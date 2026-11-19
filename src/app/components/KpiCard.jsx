import styled, { css } from 'styled-components'
import Icon from './Icon'

const Wrap = styled.div`
  border-radius: ${(p) => p.theme.brand.radius};
  padding: 18px 20px;
  display: grid;
  gap: 4px;
  min-width: 0;
  ${(p) =>
    p.$hero
      ? css`
          color: #fff;
          background: linear-gradient(135deg, ${p.theme.brand.navy} 0%, ${p.theme.brand.blue700} 100%);
          box-shadow: 0 8px 22px rgba(21, 86, 192, 0.28);
        `
      : css`
          color: ${p.theme.brand.text};
          background: ${p.theme.brand.card};
          border: 1px solid ${p.theme.brand.line};
          box-shadow: ${p.theme.brand.shadow};
        `}
`

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  opacity: 0.95;
`

const Chip = styled.span`
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  flex: none;
  background: ${(p) => (p.$hero ? 'rgba(255,255,255,0.18)' : p.theme.brand.blue100)};
  color: ${(p) => (p.$hero ? '#fff' : p.theme.brand.blue700)};
`

const Value = styled.div`
  font-size: 32px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.5px;
`

const Details = styled.dl`
  margin: 6px 0 0;
  padding-top: 10px;
  border-top: 1px solid ${(p) => (p.$hero ? 'rgba(255,255,255,0.22)' : p.theme.brand.line)};
  display: grid;
  gap: 2px;
  font-size: 13px;
  div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  dt {
    opacity: 0.85;
  }
  dd {
    margin: 0;
    font-weight: 600;
  }
`

/** `details`: [{ label, value }] com os números secundários do cartão. */
export default function KpiCard({ label, value, icon, hero = false, details = [] }) {
  return (
    <Wrap $hero={hero}>
      <Head>
        <span>{label}</span>
        {icon && (
          <Chip $hero={hero}>
            <Icon name={icon} />
          </Chip>
        )}
      </Head>
      <Value>{value}</Value>
      {details.length > 0 && (
        <Details $hero={hero}>
          {details.map((d) => (
            <div key={d.label}>
              <dt>{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </Details>
      )}
    </Wrap>
  )
}
