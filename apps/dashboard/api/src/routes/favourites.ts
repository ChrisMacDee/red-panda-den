import { Router } from 'express'
import { z } from 'zod'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { favourites } from '../db/schema/dashboard'

export const favouritesRouter = Router()

const createFavouriteSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  iconType: z.enum(['favicon', 'library', 'custom']).optional().default('favicon'),
  iconValue: z.string().optional(),
  colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

const updateFavouriteSchema = createFavouriteSchema.partial()

const reorderSchema = z.object({ ids: z.array(z.number()) })

// GET /
favouritesRouter.get('/', async (_req, res) => {
  try {
    const rows = await db.select().from(favourites).orderBy(asc(favourites.sortOrder))
    res.json({ data: rows })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favourites', details: error })
  }
})

// POST /
favouritesRouter.post('/', async (req, res) => {
  const parsed = createFavouriteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [created] = await db
      .insert(favourites)
      .values({
        title: parsed.data.title,
        url: parsed.data.url,
        iconType: parsed.data.iconType,
        iconValue: parsed.data.iconValue ?? null,
        colour: parsed.data.colour ?? null,
      })
      .returning()
    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create favourite', details: error })
  }
})

// PATCH /reorder — must come before /:id
favouritesRouter.patch('/reorder', async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    await Promise.all(
      parsed.data.ids.map((id, index) =>
        db
          .update(favourites)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(favourites.id, id)),
      ),
    )
    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder favourites', details: error })
  }
})

// PATCH /:id
favouritesRouter.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  const parsed = updateFavouriteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.url !== undefined) updates.url = parsed.data.url
    if (parsed.data.iconType !== undefined) updates.iconType = parsed.data.iconType
    if (parsed.data.iconValue !== undefined) updates.iconValue = parsed.data.iconValue
    if (parsed.data.colour !== undefined) updates.colour = parsed.data.colour

    const [updated] = await db
      .update(favourites)
      .set(updates)
      .where(eq(favourites.id, id))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Favourite not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update favourite', details: error })
  }
})

// DELETE /:id
favouritesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  try {
    await db.delete(favourites).where(eq(favourites.id, id))
    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete favourite', details: error })
  }
})
