import { useRef } from 'react'
import styled from 'styled-components'

const List = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
`

const TabButton = styled.button`
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  padding: 8px 18px;
  border-radius: 999px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  color: ${(p) => (p.$active ? p.theme.brand.blue900 : p.theme.brand.muted)};
  background: ${(p) => (p.$active ? p.theme.brand.blue100 : 'transparent')};
  &:hover:not([aria-selected='true']) {
    background: ${(p) => p.theme.brand.blue50};
  }
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 2px;
  }
`

export const tabId = (key) => `tab-${key}`
export const panelId = (key) => `panel-${key}`

/** Abas WAI-ARIA: setas, Home e End movem o foco e a seleção. `tabs`: [{ key, label }]. */
export default function PillTabs({ tabs, selected, onChange, label }) {
  const refs = useRef({})

  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.key === selected)
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }
    if (!(event.key in moves)) return
    event.preventDefault()
    const next = tabs[(moves[event.key] + tabs.length) % tabs.length]
    onChange(next.key)
    refs.current[next.key]?.focus()
  }

  return (
    <List role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          ref={(el) => {
            refs.current[tab.key] = el
          }}
          id={tabId(tab.key)}
          type="button"
          role="tab"
          aria-selected={selected === tab.key}
          aria-controls={panelId(tab.key)}
          tabIndex={selected === tab.key ? 0 : -1}
          $active={selected === tab.key}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </TabButton>
      ))}
    </List>
  )
}
