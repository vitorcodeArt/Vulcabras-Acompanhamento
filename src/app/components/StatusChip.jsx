import styled, { css } from 'styled-components'
import Icon from './Icon'
import { useLabel } from '../hooks/useLabel'

const TONES = {
  neutral: ['#EEF1F6', '#3D4B63'],
  blue: ['#E3EDFD', '#0F3B8C'],
  success: ['#E3F4E9', '#0B5D2A'],
  warning: ['#FFF1D6', '#7A4600'],
  danger: ['#FDE8E6', '#8C1D18']
}

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  ${(p) => css`
    background: ${TONES[p.$tone][0]};
    color: ${TONES[p.$tone][1]};
  `}
`

// [tom, ícone]: o ícone e o texto dizem o mesmo, a cor só reforça.
const CLICK = {
  not_clicked: ['neutral', 'minus'],
  clicked: ['blue', 'click'],
  send_failed: ['danger', 'ban']
}
const STATUS = {
  completed: ['success', 'check'],
  handoff: ['blue', 'headset'],
  not_eligible: ['blue', 'info'],
  error: ['danger', 'alert'],
  abandoned: ['neutral', 'x'],
  in_progress: ['warning', 'clock']
}

function Pill({ tone, icon, children }) {
  return (
    <Chip $tone={tone}>
      <Icon name={icon} size={14} />
      {children}
    </Chip>
  )
}

/** Status do clique (Sem clique / Clicou / Falha no envio). Usa `click_status_label` se a API trouxer. */
export function ClickChip({ item }) {
  const label = useLabel()
  const [tone, icon] = CLICK[item.click_status] ?? ['neutral', 'minus']
  return (
    <Pill tone={tone} icon={icon}>
      {item.click_status_label ?? label('clickStatus', item.click_status)}
    </Pill>
  )
}

/** Situação da sessão; sem sessão não há situação ("–"). */
export function SituationChip({ item }) {
  const label = useLabel()
  if (!item.session_status) return <span>–</span>
  const [tone, icon] = STATUS[item.session_status] ?? ['neutral', 'minus']
  return (
    <Pill tone={tone} icon={icon}>
      {item.session_status_label ?? label('status', item.session_status)}
    </Pill>
  )
}
