import { useEffect, useState } from 'react'

/** true quando `pending` dura mais que `ms` (servidor provavelmente acordando). */
export function useSlow(pending, ms = 6000) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!pending) {
      setSlow(false)
      return undefined
    }
    const timer = setTimeout(() => setSlow(true), ms)
    return () => clearTimeout(timer)
  }, [pending, ms])
  return slow
}
