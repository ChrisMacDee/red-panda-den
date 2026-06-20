import { Router } from 'express'
import { z } from 'zod'
import { eq, desc, asc, ilike, and, count } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { db } from '../db'
import { topics, resources, notes } from '../db/schema/knowledge'

export const knowledgeRouter = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const date = new Date().toISOString().split('T')[0]
      const dir = path.join('/data/uploads/knowledge', date)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// ── Zod schemas ─────────────────────────────────────────────────────────────

const statusEnum = z.enum(['not_started', 'in_progress', 'completed', 'revisiting'])
const resourceTypeEnum = z.enum(['course', 'video', 'article', 'book', 'documentation', 'wiki', 'other'])

const createTopicSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  status: statusEnum.optional().default('not_started'),
})

const updateTopicSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().min(1).optional(),
  status: statusEnum.optional(),
})

const progressSchema = z.object({
  progress: z.number().int().min(0).max(100),
})

const createResourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().optional().nullable(),
  resourceType: resourceTypeEnum.optional().default('article'),
  notes: z.string().optional(),
})

const updateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().nullable().optional(),
  resourceType: resourceTypeEnum.optional(),
  notes: z.string().nullable().optional(),
  completed: z.boolean().optional(),
})

const createNoteSchema = z.object({ body: z.string().min(1) })
const updateNoteSchema = z.object({ body: z.string().min(1) })

// ── Topics ───────────────────────────────────────────────────────────────────

// GET / — list with optional ?status= ?category= ?search=
knowledgeRouter.get('/', async (req, res) => {
  try {
    const { status, category, search } = req.query as Record<string, string | undefined>

    const conditions: SQL[] = []
    if (status) conditions.push(eq(topics.status, status))
    if (category) conditions.push(eq(topics.category, category))
    if (search) conditions.push(ilike(topics.title, `%${search}%`))

    const rows =
      conditions.length > 0
        ? await db.select().from(topics).where(and(...conditions)).orderBy(desc(topics.updatedAt))
        : await db.select().from(topics).orderBy(desc(topics.updatedAt))

    res.json({ data: rows })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topics', details: error })
  }
})

// GET /stats — dashboard summary card data (must come before /:id)
knowledgeRouter.get('/stats', async (_req, res) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(topics)
    const [{ inProgress }] = await db
      .select({ inProgress: count() })
      .from(topics)
      .where(eq(topics.status, 'in_progress'))
    const [{ completed }] = await db
      .select({ completed: count() })
      .from(topics)
      .where(eq(topics.status, 'completed'))
    const recentlyUpdated = await db
      .select()
      .from(topics)
      .orderBy(desc(topics.updatedAt))
      .limit(3)

    res.json({ data: { total, inProgress, completed, recentlyUpdated } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch knowledge stats', details: error })
  }
})

// GET /:id — single topic with resources and notes
knowledgeRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [topic] = await db.select().from(topics).where(eq(topics.id, id))

    if (!topic) {
      res.status(404).json({ error: 'Topic not found' })
      return
    }

    const [topicResources, topicNotes] = await Promise.all([
      db.select().from(resources).where(eq(resources.topicId, id)).orderBy(asc(resources.createdAt)),
      db.select().from(notes).where(eq(notes.topicId, id)).orderBy(desc(notes.createdAt)),
    ])

    res.json({ data: { ...topic, resources: topicResources, notes: topicNotes } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topic', details: error })
  }
})

// POST / — create topic
knowledgeRouter.post('/', async (req, res) => {
  const parsed = createTopicSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [created] = await db
      .insert(topics)
      .values({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        category: parsed.data.category,
        status: parsed.data.status,
      })
      .returning()

    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create topic', details: error })
  }
})

// PATCH /:id — update topic metadata
knowledgeRouter.patch('/:id', async (req, res) => {
  const { id } = req.params
  const parsed = updateTopicSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.description !== undefined) updates.description = parsed.data.description
    if (parsed.data.category !== undefined) updates.category = parsed.data.category
    if (parsed.data.status !== undefined) updates.status = parsed.data.status

    const [updated] = await db.update(topics).set(updates).where(eq(topics.id, id)).returning()

    if (!updated) {
      res.status(404).json({ error: 'Topic not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update topic', details: error })
  }
})

// DELETE /:id
knowledgeRouter.delete('/:id', async (req, res) => {
  try {
    await db.delete(topics).where(eq(topics.id, req.params.id))
    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete topic', details: error })
  }
})

// PATCH /:id/progress — update progress slider value only
knowledgeRouter.patch('/:id/progress', async (req, res) => {
  const { id } = req.params
  const parsed = progressSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [updated] = await db
      .update(topics)
      .set({ progress: parsed.data.progress, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Topic not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress', details: error })
  }
})

// ── Resources ────────────────────────────────────────────────────────────────

// POST /:id/resources — add resource by URL
knowledgeRouter.post('/:id/resources', async (req, res) => {
  const { id } = req.params
  const parsed = createResourceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [created] = await db
      .insert(resources)
      .values({
        topicId: id,
        title: parsed.data.title,
        url: parsed.data.url ?? null,
        resourceType: parsed.data.resourceType,
        notes: parsed.data.notes ?? null,
      })
      .returning()

    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource', details: error })
  }
})

// POST /:id/resources/upload — upload a content file
knowledgeRouter.post('/:id/resources/upload', upload.single('file'), async (req, res) => {
  const id = req.params['id'] as string

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  try {
    const [created] = await db
      .insert(resources)
      .values({
        topicId: id,
        title: req.file.originalname,
        resourceType: 'other',
        filePath: req.file.path,
      })
      .returning()

    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save uploaded resource', details: error })
  }
})

// PATCH /:id/resources/:resourceId
knowledgeRouter.patch('/:id/resources/:resourceId', async (req, res) => {
  const { resourceId } = req.params
  const parsed = updateResourceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.url !== undefined) updates.url = parsed.data.url
    if (parsed.data.resourceType !== undefined) updates.resourceType = parsed.data.resourceType
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes
    if (parsed.data.completed !== undefined) updates.completed = parsed.data.completed

    const [updated] = await db
      .update(resources)
      .set(updates)
      .where(eq(resources.id, resourceId))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resource', details: error })
  }
})

// DELETE /:id/resources/:resourceId
knowledgeRouter.delete('/:id/resources/:resourceId', async (req, res) => {
  try {
    await db.delete(resources).where(eq(resources.id, req.params.resourceId))
    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource', details: error })
  }
})

// ── Notes ────────────────────────────────────────────────────────────────────

// POST /:id/notes
knowledgeRouter.post('/:id/notes', async (req, res) => {
  const { id } = req.params
  const parsed = createNoteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [created] = await db
      .insert(notes)
      .values({ topicId: id, body: parsed.data.body })
      .returning()

    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note', details: error })
  }
})

// PATCH /:id/notes/:noteId
knowledgeRouter.patch('/:id/notes/:noteId', async (req, res) => {
  const { noteId } = req.params
  const parsed = updateNoteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    return
  }

  try {
    const [updated] = await db
      .update(notes)
      .set({ body: parsed.data.body, updatedAt: new Date() })
      .where(eq(notes.id, noteId))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note', details: error })
  }
})

// DELETE /:id/notes/:noteId
knowledgeRouter.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    await db.delete(notes).where(eq(notes.id, req.params.noteId))
    res.json({ data: null })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note', details: error })
  }
})
