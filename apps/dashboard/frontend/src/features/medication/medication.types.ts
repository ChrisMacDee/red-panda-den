export type MedicationAction = 'taken' | 'restocked' | 'disposed' | 'adjusted'

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  dosesPerDay: number
  person: string
  prescriber: string | null
  pharmacy: string | null
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface MedStock {
  id: string
  medicationId: string
  quantity: number
  unit: string
  reorderThreshold: number
  updatedAt: string
}

export interface LogEntry {
  id: string
  medicationId: string
  action: MedicationAction
  quantityDelta: number
  notes: string | null
  occurredAt: string
}

export interface MedicationWithStock extends Medication {
  stock: MedStock | null
}

export interface MedicationDetail extends Medication {
  stock: MedStock | null
  recentLog: LogEntry[]
}

export interface CreateMedicationDto {
  name: string
  dosage: string
  frequency: string
  dosesPerDay?: number
  person: string
  prescriber?: string
  pharmacy?: string
  notes?: string
  initialQuantity?: number
  unit?: string
  reorderThreshold?: number
}

export interface UpdateMedicationDto {
  name?: string
  dosage?: string
  frequency?: string
  dosesPerDay?: number
  person?: string
  prescriber?: string | null
  pharmacy?: string | null
  notes?: string | null
  active?: boolean
}

export interface LogActionDto {
  action: MedicationAction
  quantityDelta: number
  notes?: string
}

export type StockStatus = 'ok' | 'low' | 'critical'

export function stockStatus(quantity: number, dosesPerDay: number, threshold: number): StockStatus {
  if (dosesPerDay <= 0) return 'ok'
  const days = Math.floor(quantity / dosesPerDay)
  if (days <= 0) return 'critical'
  if (days < threshold) return 'low'
  return 'ok'
}

export function daysRemainingLabel(
  quantity: number,
  dosesPerDay: number,
): string {
  if (dosesPerDay <= 0) return '∞ days'
  const days = Math.floor(quantity / dosesPerDay)
  if (days === 0) return 'Out of stock'
  return `${days} day${days === 1 ? '' : 's'} left`
}
