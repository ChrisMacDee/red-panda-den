import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'

type HealthStatus = 'healthy' | 'degraded' | 'unknown'

interface ServiceHealthMap {
  [serviceName: string]: HealthStatus
}

interface ServiceHealthResponse {
  data: ServiceHealthMap
}

async function fetchServiceHealth(): Promise<ServiceHealthMap> {
  const response = await apiClient.get<ServiceHealthResponse>('/health/services')
  return response.data.data
}

export function useServiceHealth() {
  return useQuery({
    queryKey: ['service-health'],
    queryFn: fetchServiceHealth,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
