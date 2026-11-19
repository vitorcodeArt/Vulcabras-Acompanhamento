import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useApi } from '../app/hooks/useApi'

/** Consulta GET ao contrato. O cliente já faz o retry automático; aqui o retry fica desligado. */
export function useApiQuery(path, params, options = {}) {
  const { api, demo } = useApi()
  return useQuery({
    queryKey: ['api', demo, path, params ?? {}],
    queryFn: () => api.get(path, params),
    ...options
  })
}

export const useHealth = () => useApiQuery('/health')

/** Lista paginada por cursor (`next_cursor` opaco; `null` = acabou). */
export function useApiInfiniteQuery(path, params) {
  const { api, demo } = useApi()
  return useInfiniteQuery({
    queryKey: ['api-infinite', demo, path, params ?? {}],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => api.get(path, { ...params, cursor: pageParam }),
    getNextPageParam: (last) => last.data.next_cursor ?? undefined
  })
}
