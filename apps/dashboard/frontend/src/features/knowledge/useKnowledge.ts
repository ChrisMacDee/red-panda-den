import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import type {
  Topic,
  TopicWithDetails,
  KnowledgeStats,
  CreateTopicDto,
  UpdateTopicDto,
  CreateResourceDto,
  UpdateResourceDto,
  CreateNoteDto,
  UpdateNoteDto,
  Resource,
  Note,
} from './knowledge.types'

interface ApiResponse<T> {
  data: T
}

const KEYS = {
  topics: (filters?: Record<string, string>) => ['knowledge', 'topics', filters] as const,
  topic: (id: string) => ['knowledge', 'topics', id] as const,
  stats: ['knowledge', 'stats'] as const,
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useTopics(filters?: { status?: string; category?: string; search?: string }) {
  return useQuery({
    queryKey: KEYS.topics(filters as Record<string, string>),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.category) params.set('category', filters.category)
      if (filters?.search) params.set('search', filters.search)
      const response = await apiClient.get<ApiResponse<Topic[]>>(
        `/knowledge${params.toString() ? `?${params}` : ''}`,
      )
      return response.data.data
    },
  })
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: KEYS.topic(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TopicWithDetails>>(`/knowledge/${id}`)
      return response.data.data
    },
    enabled: Boolean(id),
  })
}

export function useKnowledgeStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<KnowledgeStats>>('/knowledge/stats')
      return response.data.data
    },
  })
}

// ── Topic mutations ───────────────────────────────────────────────────────────

export function useCreateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateTopicDto): Promise<Topic> => {
      const response = await apiClient.post<ApiResponse<Topic>>('/knowledge', dto)
      return response.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge'] })
    },
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateTopicDto & { id: string }): Promise<Topic> => {
      const response = await apiClient.patch<ApiResponse<Topic>>(`/knowledge/${id}`, dto)
      return response.data.data
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(id) })
      void qc.invalidateQueries({ queryKey: ['knowledge', 'topics'] })
      void qc.invalidateQueries({ queryKey: KEYS.stats })
    },
  })
}

export function useDeleteTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/knowledge/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge'] })
    },
  })
}

export function useUpdateProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }): Promise<Topic> => {
      const response = await apiClient.patch<ApiResponse<Topic>>(`/knowledge/${id}/progress`, {
        progress,
      })
      return response.data.data
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(id) })
      void qc.invalidateQueries({ queryKey: KEYS.stats })
    },
  })
}

// ── Resource mutations ────────────────────────────────────────────────────────

export function useCreateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      ...dto
    }: CreateResourceDto & { topicId: string }): Promise<Resource> => {
      const response = await apiClient.post<ApiResponse<Resource>>(
        `/knowledge/${topicId}/resources`,
        dto,
      )
      return response.data.data
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}

export function useUploadResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ topicId, file }: { topicId: string; file: File }): Promise<Resource> => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post<ApiResponse<Resource>>(
        `/knowledge/${topicId}/resources/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return response.data.data
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      resourceId,
      ...dto
    }: UpdateResourceDto & { topicId: string; resourceId: string }): Promise<Resource> => {
      const response = await apiClient.patch<ApiResponse<Resource>>(
        `/knowledge/${topicId}/resources/${resourceId}`,
        dto,
      )
      return response.data.data
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      resourceId,
    }: {
      topicId: string
      resourceId: string
    }): Promise<void> => {
      await apiClient.delete(`/knowledge/${topicId}/resources/${resourceId}`)
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}

// ── Note mutations ────────────────────────────────────────────────────────────

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      ...dto
    }: CreateNoteDto & { topicId: string }): Promise<Note> => {
      const response = await apiClient.post<ApiResponse<Note>>(
        `/knowledge/${topicId}/notes`,
        dto,
      )
      return response.data.data
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      noteId,
      ...dto
    }: UpdateNoteDto & { topicId: string; noteId: string }): Promise<Note> => {
      const response = await apiClient.patch<ApiResponse<Note>>(
        `/knowledge/${topicId}/notes/${noteId}`,
        dto,
      )
      return response.data.data
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      noteId,
    }: {
      topicId: string
      noteId: string
    }): Promise<void> => {
      await apiClient.delete(`/knowledge/${topicId}/notes/${noteId}`)
    },
    onSuccess: (_data, { topicId }) => {
      void qc.invalidateQueries({ queryKey: KEYS.topic(topicId) })
    },
  })
}
