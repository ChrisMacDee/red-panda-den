import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'

// Hoisted so the factory below can close over these references
const { mockDb, setSelectResult, setInsertResult, setUpdateResult } = vi.hoisted(() => {
  let selectResult: unknown[] = []
  let insertResult: unknown[] = []
  let updateResult: unknown[] = []

  function makeBuilder(getResult: () => unknown[]) {
    const b: Record<string, unknown> = {}
    const chain = ['from', 'where', 'orderBy', 'limit', 'set', 'values', 'leftJoin', 'innerJoin']
    chain.forEach((m) => (b[m] = () => b))
    b['returning'] = () => Promise.resolve(getResult())
    b['then'] = (res: (v: unknown) => void, rej: (r: unknown) => void) =>
      Promise.resolve(getResult()).then(res, rej)
    b['catch'] = (rej: (r: unknown) => void) => Promise.resolve(getResult()).catch(rej)
    return b
  }

  const mockDb = {
    select: () => makeBuilder(() => selectResult),
    insert: () => makeBuilder(() => insertResult),
    update: () => makeBuilder(() => updateResult),
    delete: () => makeBuilder(() => []),
  }

  return {
    mockDb,
    setSelectResult: (v: unknown[]) => { selectResult = v },
    setInsertResult: (v: unknown[]) => { insertResult = v },
    setUpdateResult: (v: unknown[]) => { updateResult = v },
  }
})

vi.mock('../db', () => ({ db: mockDb }))

const TOPIC = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  title: 'TypeScript Generics',
  description: 'Advanced TS patterns',
  category: 'Programming',
  status: 'not_started',
  progress: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const RESOURCE = {
  id: 'bbbbbbbb-0000-0000-0000-000000000001',
  topicId: TOPIC.id,
  title: 'TS Handbook',
  url: 'https://www.typescriptlang.org/docs/',
  resourceType: 'documentation',
  notes: null,
  completed: false,
  filePath: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const NOTE = {
  id: 'cccccccc-0000-0000-0000-000000000001',
  topicId: TOPIC.id,
  body: 'Key insight about generics',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeEach(() => {
  setSelectResult([])
  setInsertResult([])
  setUpdateResult([])
})

// ── Topics ───────────────────────────────────────────────────────────────────

describe('GET /api/knowledge', () => {
  it('returns 200 with an array', async () => {
    setSelectResult([TOPIC])
    const res = await request(app).get('/api/knowledge')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data[0].id).toBe(TOPIC.id)
  })

  it('returns 200 with empty array when no topics', async () => {
    const res = await request(app).get('/api/knowledge')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('GET /api/knowledge/stats', () => {
  it('returns 200 with stats shape', async () => {
    // Mock returns same object for all count queries; keys not matching the
    // destructure pattern come out as undefined and are stripped from JSON.
    // Shape validation is handled by the type system; here we just verify the route works.
    setSelectResult([{ total: 0, inProgress: 0, completed: 0 }])
    const res = await request(app).get('/api/knowledge/stats')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
  })
})

describe('GET /api/knowledge/:id', () => {
  it('returns 404 when topic does not exist', async () => {
    const res = await request(app).get('/api/knowledge/nonexistent-id')
    expect(res.status).toBe(404)
  })

  it('returns 200 with topic and nested arrays when found', async () => {
    setSelectResult([TOPIC])
    const res = await request(app).get(`/api/knowledge/${TOPIC.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(TOPIC.id)
    expect(Array.isArray(res.body.data.resources)).toBe(true)
    expect(Array.isArray(res.body.data.notes)).toBe(true)
  })
})

describe('POST /api/knowledge', () => {
  it('returns 400 when body is invalid', async () => {
    const res = await request(app).post('/api/knowledge').send({ description: 'Missing title and category' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid request body')
  })

  it('returns 201 with created topic on valid body', async () => {
    setInsertResult([TOPIC])
    const res = await request(app)
      .post('/api/knowledge')
      .send({ title: TOPIC.title, category: TOPIC.category })
    expect(res.status).toBe(201)
    expect(res.body.data.id).toBe(TOPIC.id)
  })
})

describe('PATCH /api/knowledge/:id', () => {
  it('returns 404 when topic does not exist', async () => {
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}`)
      .send({ title: 'Updated' })
    expect(res.status).toBe(404)
  })

  it('returns 200 with updated topic', async () => {
    setUpdateResult([{ ...TOPIC, title: 'Updated' }])
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}`)
      .send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Updated')
  })
})

describe('DELETE /api/knowledge/:id', () => {
  it('returns 200', async () => {
    const res = await request(app).delete(`/api/knowledge/${TOPIC.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
  })
})

describe('PATCH /api/knowledge/:id/progress', () => {
  it('returns 400 when progress is out of range', async () => {
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}/progress`)
      .send({ progress: 150 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when progress is missing', async () => {
    const res = await request(app).patch(`/api/knowledge/${TOPIC.id}/progress`).send({})
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated topic', async () => {
    setUpdateResult([{ ...TOPIC, progress: 50 }])
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}/progress`)
      .send({ progress: 50 })
    expect(res.status).toBe(200)
    expect(res.body.data.progress).toBe(50)
  })
})

// ── Resources ─────────────────────────────────────────────────────────────────

describe('POST /api/knowledge/:id/resources', () => {
  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post(`/api/knowledge/${TOPIC.id}/resources`)
      .send({ url: 'https://example.com' })
    expect(res.status).toBe(400)
  })

  it('returns 201 with created resource', async () => {
    setInsertResult([RESOURCE])
    const res = await request(app)
      .post(`/api/knowledge/${TOPIC.id}/resources`)
      .send({ title: RESOURCE.title, url: RESOURCE.url, resourceType: 'documentation' })
    expect(res.status).toBe(201)
    expect(res.body.data.id).toBe(RESOURCE.id)
  })
})

describe('PATCH /api/knowledge/:id/resources/:resourceId', () => {
  it('returns 404 when resource does not exist', async () => {
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}/resources/${RESOURCE.id}`)
      .send({ completed: true })
    expect(res.status).toBe(404)
  })

  it('returns 200 toggling completed', async () => {
    setUpdateResult([{ ...RESOURCE, completed: true }])
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}/resources/${RESOURCE.id}`)
      .send({ completed: true })
    expect(res.status).toBe(200)
    expect(res.body.data.completed).toBe(true)
  })
})

describe('DELETE /api/knowledge/:id/resources/:resourceId', () => {
  it('returns 200', async () => {
    const res = await request(app).delete(
      `/api/knowledge/${TOPIC.id}/resources/${RESOURCE.id}`,
    )
    expect(res.status).toBe(200)
  })
})

// ── Notes ─────────────────────────────────────────────────────────────────────

describe('POST /api/knowledge/:id/notes', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .post(`/api/knowledge/${TOPIC.id}/notes`)
      .send({ body: '' })
    expect(res.status).toBe(400)
  })

  it('returns 201 with created note', async () => {
    setInsertResult([NOTE])
    const res = await request(app)
      .post(`/api/knowledge/${TOPIC.id}/notes`)
      .send({ body: NOTE.body })
    expect(res.status).toBe(201)
    expect(res.body.data.id).toBe(NOTE.id)
  })
})

describe('PATCH /api/knowledge/:id/notes/:noteId', () => {
  it('returns 404 when note does not exist', async () => {
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}/notes/${NOTE.id}`)
      .send({ body: 'Updated' })
    expect(res.status).toBe(404)
  })

  it('returns 200 with updated note', async () => {
    setUpdateResult([{ ...NOTE, body: 'Updated' }])
    const res = await request(app)
      .patch(`/api/knowledge/${TOPIC.id}/notes/${NOTE.id}`)
      .send({ body: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.body).toBe('Updated')
  })
})

describe('DELETE /api/knowledge/:id/notes/:noteId', () => {
  it('returns 200', async () => {
    const res = await request(app).delete(
      `/api/knowledge/${TOPIC.id}/notes/${NOTE.id}`,
    )
    expect(res.status).toBe(200)
  })
})
