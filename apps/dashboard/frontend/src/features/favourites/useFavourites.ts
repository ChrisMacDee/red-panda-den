import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import type { Favourite, CreateFavouriteDto, UpdateFavouriteDto } from './favourites.types'

const QUERY_KEY = ['favourites'] as const

interface ApiResponse<T> {
  data: T
}

async function fetchFavourites(): Promise<Favourite[]> {
  const response = await apiClient.get<ApiResponse<Favourite[]>>('/favourites')
  return response.data.data
}

export function useFavourites() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFavourites,
  })
}

export function useCreateFavourite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateFavouriteDto): Promise<Favourite> => {
      const response = await apiClient.post<ApiResponse<Favourite>>('/favourites', dto)
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateFavourite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateFavouriteDto & { id: number }): Promise<Favourite> => {
      const response = await apiClient.patch<ApiResponse<Favourite>>(`/favourites/${id}`, dto)
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteFavourite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/favourites/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useReorderFavourites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: number[]): Promise<void> => {
      await apiClient.patch('/favourites/reorder', { ids })
    },
    onMutate: async (ids: number[]) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData<Favourite[]>(QUERY_KEY)

      if (previous) {
        const reordered = ids
          .map((id) => previous.find((f) => f.id === id))
          .filter((f): f is Favourite => f !== undefined)
          .map((f, index) => ({ ...f, sortOrder: index }))

        queryClient.setQueryData<Favourite[]>(QUERY_KEY, reordered)
      }

      return { previous }
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Favourite[]>(QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
