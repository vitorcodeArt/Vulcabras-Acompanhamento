import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Icon from './Icon'
import { copyText } from '../../lib/clipboard'
import { useI18n } from '../hooks/useI18n'

const Btn = styled.button`
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  color: ${(p) => p.theme.brand.blue700};
  background: transparent;
  &:hover {
    background: ${(p) => p.theme.brand.blue100};
  }
  &:focus-visible {
    outline: 3px solid ${(p) => p.theme.brand.blue500};
    outline-offset: 1px;
  }
`

/** Copia `text`; anuncia "Copiado" para leitor de tela. Não propaga o clique (a linha da tabela é clicável). */
export default function CopyButton({ text, label }) {
  const { t } = useI18n()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done) return undefined
    const timer = setTimeout(() => setDone(false), 1800)
    return () => clearTimeout(timer)
  }, [done])

  return (
    <>
      <Btn
        type="button"
        aria-label={label}
        title={done ? t('common.copied') : label}
        onClick={async (event) => {
          event.stopPropagation()
          setDone(await copyText(text))
        }}
      >
        <Icon name={done ? 'check' : 'copy'} size={16} />
      </Btn>
      <span className="sr-only" role="status">
        {done ? t('common.copied') : ''}
      </span>
    </>
  )
}
