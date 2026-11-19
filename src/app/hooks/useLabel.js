import { useCallback } from 'react'
import { useI18n } from './useI18n'

/**
 * Rótulo fixo da interface para chaves do contrato que a API não traz com `label`
 * (marca, fluxo). Chave desconhecida: mostra a própria chave.
 */
export function useLabel() {
  const i18n = useI18n()
  return useCallback(
    (group, key) => {
      try {
        return i18n.t(`${group}.${key}`)
      } catch {
        return String(key)
      }
    },
    [i18n]
  )
}
