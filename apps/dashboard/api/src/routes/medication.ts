import { Router } from 'express'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { db } from '../db'
import { medications, stock, medLog } from '../db/schema/medication'
import { daysRemaining, checkMedicationAlerts } from '../scheduler'
import { sendMedicationAlert } from '../services/ntfy'

export const medicationRouter = Router()

// ── Zod schemas ──────────────────────────────────────────────────────────────

const actionEnum = z.enum(['taken', 'restocked', 'disposed', 'adjusted'])

const createMedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  dosesPerDay: z.number().int().positive().default(1),
  person: z.string().min(1),
  prescriber: z.string().optional(),
  pharmacy: z.string().optional(),
  notes: z.string().optional(),
  initialQuantity: z.number().int().min(0).optional().default(0),
  unit: z.string().optional().default('tablets'),
  reorderThreshold: z.number().int().positive().optional().default(14),
})

const updateMedicationSchema = z.object({
  name: z.string().min(1).optional(),
  dosage: z.string().min(1).optional(),
  frequency: z.string().min(1).optional(),
  dosesPerDay: z.number().int().positive().optional(),
  person: z.string().min(1).optional(),
  prescriber: z.string().nullable().optional(),
  pharmacy: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

const updateStockSettingsSchema = z.object({
  unit: z.string().min(1).optional(),
  reorderThreshold: z.number().int().positive().optional(),
})

const logActionSchema = z.object({
  action: actionEnum,
  quantityDelta: z.number().int(),
  notes: z.string().optional(),
})

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fireAlertIfLow(medicationId: string): Promise<void> {
  const [[med], [stockRecord]] = await Promise.all([
    db.select().from(medications).where(eq(medications.id, medicationId)),
    db.select().from(stock).where(eq(stock.medicationId, medicationId)),
  ])
  if (!med || !stockRecord) return

  const days = daysRemaining(stockRecord.quantity, med.dosesPerDay)
  if (days < stockRecord.reorderThreshold) {
    void sendMedicationAlert({
      title: `Low stock: ${med.name}`,
      message: `${med.name} for ${med.person} has ${days} day${days === 1 ? '' : 's'} of supply remaining (${stockRecord.quantity} ${stockRecord.unit} left). Reorder needed.`,
      priority: days <= 0 ? 5 : 4,
      tags: ['pill', days <= 0 ? 'rotating_light' : 'warning'],
    }).catch((err: unknown) =>
      console.error('[medication] Failed to send alert:', err),
    )
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET / — list medications (with stock); ?includeInactive=true to include inactive
medicationRouter.get('/', async (req, res) => {
  try {
    const includeInactive = req.query['includeInactive'] === 'true'

    const rows = includeInactive
      ? await db.select().from(medications).leftJoin(stock, eq(stock.medicationId, medications.id))
      : await db
          .select()
          .from(medications)
          .leftJoin(stock, eq(stock.medicationId, medications.id))
          .where(eq(medications.active, true))

    const data = rows.map(({ medications: med, stock: s }) => ({ ...med, stock: s }))
    res.json({ data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medications', details: error })
  }
})

// GET /alerts — active medications currently below reorder threshold (before /:id)
medicationRouter.get('/alerts', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(medications)
      .leftJoin(stock, eq(stock.medicationId, medications.id))
      .where(eq(medications.active, true))

    const alerts = rows
      .map(({ medications: med, stock: s }) => ({ ...med, stock: s }))
      .filter((item) => {
        if (!item.stock) return false
        const days = daysRemaining(item.stock.quantity, item.dosesPerDay)
        return days < item.stock.reorderThreshold
      })

    res.json({ data: alerts })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts', details: error })
  }
})

// GET /:id — medication with stock and recent log
medicationRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [row] = await db
      .select()
      .from(medications)
      .leftJoin(stock, eq(stock.medicationId, medications.id))
      .where(eq(medications.id, id))

    if (!row) {
      res.status(404).json({ error: 'Medication not found' })
      return
    }

    const recentLog = await db
      .select()
      .from(medLog)
      .where(eq(medLog.medicationId, id))
      .orderBy(desc(medLog.occurredAt))
      .limit(20)

    res.json({ data: { ...row.medications, stock: row.stock, recentLog } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medication', details: error })
  }
})

// POST / — create medication + initialise stock record
medicationRouter.post('/', async (req, res) => {
  const parsed = createMedicationSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const { initialQuantity, unit, reorderThreshold, ...medFields } = parsed.data

    const med = await db.transaction(async (tx) => {
      const [created] = await tx.insert(medications).values(medFields).returning()
      await tx.insert(stock).values({
        medicationId: created.id,
        quantity: initialQuantity,
        unit,
        reorderThreshold,
      })
      return created
    })

    res.status(201).json({ data: med })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create medication', details: error })
  }
})

// PATCH /:id — update medication fields
medicationRouter.patch('/:id', async (req, res) => {
  const { id } = req.params
  const parsed = updateMedicationSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    const d = parsed.data
    if (d.name !== undefined) updates.name = d.name
    if (d.dosage !== undefined) updates.dosage = d.dosage
    if (d.frequency !== undefined) updates.frequency = d.frequency
    if (d.dosesPerDay !== undefined) updates.dosesPerDay = d.dosesPerDay
    if (d.person !== undefined) updates.person = d.person
    if (d.prescriber !== undefined) updates.prescriber = d.prescriber
    if (d.pharmacy !== undefined) updates.pharmacy = d.pharmacy
    if (d.notes !== undefined) updates.notes = d.notes
    if (d.active !== undefined) updates.active = d.active

    const [updated] = await db
      .update(medications)
      .set(updates)
      .where(eq(medications.id, id))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Medication not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medication', details: error })
  }
})

// DELETE /:id — soft delete (deactivate)
medicationRouter.delete('/:id', async (req, res) => {
  try {
    const [updated] = await db
      .update(medications)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(medications.id, req.params.id), eq(medications.active, true)))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Medication not found' })
      return
    }

    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate medication', details: error })
  }
})

// PATCH /:id/stock — update stock settings (unit, reorderThreshold)
medicationRouter.patch('/:id/stock', async (req, res) => {
  const { id } = req.params
  const parsed = updateStockSettingsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.unit !== undefined) updates.unit = parsed.data.unit
    if (parsed.data.reorderThreshold !== undefined)
      updates.reorderThreshold = parsed.data.reorderThreshold

    const [updated] = await db
      .update(stock)
      .set(updates)
      .where(eq(stock.medicationId, id))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Stock record not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock settings', details: error })
  }
})

// POST /:id/log — record action and update quantity
medicationRouter.post('/:id/log', async (req, res) => {
  const { id } = req.params
  const parsed = logActionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [currentStock] = await db.select().from(stock).where(eq(stock.medicationId, id))
    if (!currentStock) {
      res.status(404).json({ error: 'Medication not found' })
      return
    }

    const newQuantity = Math.max(0, currentStock.quantity + parsed.data.quantityDelta)

    const [logEntry] = await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(medLog)
        .values({
          medicationId: id,
          action: parsed.data.action,
          quantityDelta: parsed.data.quantityDelta,
          notes: parsed.data.notes ?? null,
        })
        .returning()

      await tx
        .update(stock)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(stock.medicationId, id))

      return [entry]
    })

    // Fire-and-forget alert check after stock change
    void fireAlertIfLow(id)

    res.status(201).json({ data: { logEntry, newQuantity } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to log action', details: error })
  }
})

// POST /check-alerts — manually trigger the stock check (for testing/admin)
medicationRouter.post('/check-alerts', async (_req, res) => {
  try {
    await checkMedicationAlerts()
    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Alert check failed', details: error })
  }
})
