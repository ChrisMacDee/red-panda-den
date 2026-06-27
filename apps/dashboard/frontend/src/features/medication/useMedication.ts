import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import type {
  MedicationWithStock,
  MedicationDetail,
  MedStock,
  LogEntry,
  CreateMedicationDto,
  UpdateMedicationDto,
  LogActionDto,
  Medication,
} from './medication.types'

interface ApiResponse<T> {
  data: T
}

const KEYS = {
  list: (includeInactive?: boolean) =>
    ['medication', 'list', includeInactive] as const,
  detail: (id: string) => ['medication', 'detail', id] as const,
  alerts: ['medication', 'alerts'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useMedications(includeInactive = false) {
  return useQuery({
    queryKey: KEYS.list(includeInactive),
    queryFn: async () => {
      const url = `/medication${includeInactive ? '?includeInactive=true' : ''}`
      const res = await apiClient.get<ApiResponse<MedicationWithStock[]>>(url)
      return res.data.data
    },
  })
}

export function useMedicationDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MedicationDetail>>(`/medication/${id}`)
      return res.data.data
    },
    enabled: Boolean(id),
  })
}

export function useMedicationAlerts() {
  return useQuery({
    queryKey: KEYS.alerts,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MedicationWithStock[]>>('/medication/alerts')
      return res.data.data
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateMedicationDto): Promise<Medication> => {
      const res = await apiClient.post<ApiResponse<Medication>>('/medication', dto)
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['medication'] })
    },
  })
}

export function useUpdateMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: UpdateMedicationDto & { id: string }): Promise<Medication> => {
      const res = await apiClient.patch<ApiResponse<Medication>>(`/medication/${id}`, dto)
      return res.data.data
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      void qc.invalidateQueries({ queryKey: ['medication', 'list'] })
    },
  })
}

export function useDeactivateMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/medication/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['medication'] })
    },
  })
}

export function useUpdateStockSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: { id: string; unit?: string; reorderThreshold?: number }): Promise<MedStock> => {
      const res = await apiClient.patch<ApiResponse<MedStock>>(`/medication/${id}/stock`, dto)
      return res.data.data
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      void qc.invalidateQueries({ queryKey: ['medication', 'list'] })
      void qc.invalidateQueries({ queryKey: KEYS.alerts })
    },
  })
}

export function useLogAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: LogActionDto & { id: string }): Promise<{ logEntry: LogEntry; newQuantity: number }> => {
      const res = await apiClient.post<
        ApiResponse<{ logEntry: LogEntry; newQuantity: number }>
      >(`/medication/${id}/log`, dto)
      return res.data.data
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      void qc.invalidateQueries({ queryKey: ['medication', 'list'] })
      void qc.invalidateQueries({ queryKey: KEYS.alerts })
    },
  })
}
