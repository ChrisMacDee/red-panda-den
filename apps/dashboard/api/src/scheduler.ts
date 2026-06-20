import { eq } from 'drizzle-orm'
import { db } from './db'
import { medications, stock } from './db/schema/medication'
import { sendMedicationAlert } from './services/ntfy'

export function daysRemaining(quantity: number, dosesPerDay: number): number {
  if (dosesPerDay <= 0) return Infinity
  return Math.floor(quantity / dosesPerDay)
}

export async function checkMedicationAlerts(): Promise<void> {
  const active = await db.select().from(medications).where(eq(medications.active, true))

  for (const med of active) {
    const [stockRecord] = await db
      .select()
      .from(stock)
      .where(eq(stock.medicationId, med.id))

    if (!stockRecord) continue

    const days = daysRemaining(stockRecord.quantity, med.dosesPerDay)

    if (days < stockRecord.reorderThreshold) {
      try {
        await sendMedicationAlert({
          title: `Low stock: ${med.name}`,
          message: `${med.name} for ${med.person} has ${days} day${days === 1 ? '' : 's'} of supply remaining (${stockRecord.quantity} ${stockRecord.unit} left). Reorder needed.`,
          priority: days <= 0 ? 5 : 4,
          tags: ['pill', days <= 0 ? 'rotating_light' : 'warning'],
        })
      } catch (err) {
        console.error(`[scheduler] Failed to send alert for ${med.name}:`, err)
      }
    }
  }
}

export function startDailyScheduler(): void {
  // Initial check shortly after startup
  setTimeout(() => void checkMedicationAlerts(), 60_000)
  // Repeat every 24 hours
  setInterval(() => void checkMedicationAlerts(), 24 * 60 * 60 * 1000)
}
