import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { daysRemaining } from '../scheduler'

const { mockDb, setSelectResult, setInsertResult, setUpdateResult } = vi.hoisted(() => {
  let selectResult: unknown[] = []
  let insertResult: unknown[] = []
  let updateResult: unknown[] = []

  function makeBuilder(getResult: () => unknown[]) {
    const b: Record<string, unknown> = {}
    const methods = [
      'from', 'where', 'orderBy', 'limit', 'set', 'values',
      'leftJoin', 'innerJoin', 'unique',
    ]
    methods.forEach((m) => (b[m] = () => b))
    b['returning'] = () => Promise.resolve(getResult())
    b['then'] = (res: (v: unknown) => void, rej: (r: unknown) => void) =>
      Promise.resolve(getResult()).then(res, rej)
    b['catch'] = (rej: (r: unknown) => void) => Promise.resolve(getResult()).catch(rej)
    return b
  }

  // transaction mock: executes the callback with a mock tx and returns the result
  const mockTransaction = async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx: Record<string, unknown> = {}
    tx['select'] = () => makeBuilder(() => selectResult)
    tx['insert'] = () => makeBuilder(() => insertResult)
    tx['update'] = () => makeBuilder(() => updateResult)
    tx['delete'] = () => makeBuilder(() => [])
    return fn(tx)
  }

  const mockDb = {
    select: () => makeBuilder(() => selectResult),
    insert: () => makeBuilder(() => insertResult),
    update: () => makeBuilder(() => updateResult),
    delete: () => makeBuilder(() => []),
    transaction: mockTransaction,
  }

  return {
    mockDb,
    setSelectResult: (v: unknown[]) => { selectResult = v },
    setInsertResult: (v: unknown[]) => { insertResult = v },
    setUpdateResult: (v: unknown[]) => { updateResult = v },
  }
})

vi.mock('../db', () => ({ db: mockDb }))
vi.mock('../services/ntfy', () => ({ sendMedicationAlert: vi.fn().mockResolvedValue(undefined) }))

const MED = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  name: 'Metformin',
  dosage: '500mg',
  frequency: 'Twice daily',
  dosesPerDay: 2,
  person: 'Chris',
  prescriber: null,
  pharmacy: null,
  notes: null,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const STOCK = {
  id: 'bbbbbbbb-0000-0000-0000-000000000001',
  medicationId: MED.id,
  quantity: 60,
  unit: 'tablets',
  reorderThreshold: 14,
  updatedAt: new Date().toISOString(),
}

const LOG_ENTRY = {
  id: 'cccccccc-0000-0000-0000-000000000001',
  medicationId: MED.id,
  action: 'taken',
  quantityDelta: -1,
  notes: null,
  occurredAt: new Date().toISOString(),
}

beforeEach(() => {
  setSelectResult([])
  setInsertResult([])
  setUpdateResult([])
})

// ── daysRemaining (pure unit tests) ──────────────────────────────────────────

describe('daysRemaining', () => {
  it('returns floor of quantity / dosesPerDay', () => {
    expect(daysRemaining(60, 2)).toBe(30)
    expect(daysRemaining(7, 3)).toBe(2)
    expect(daysRemaining(0, 1)).toBe(0)
  })

  it('returns Infinity when dosesPerDay is 0', () => {
    expect(daysRemaining(100, 0)).toBe(Infinity)
  })

  it('floors fractional days', () => {
    expect(daysRemaining(5, 2)).toBe(2)
  })
})

// ── GET /api/medication ───────────────────────────────────────────────────────

describe('GET /api/medication', () => {
  it('returns 200 with medication+stock pairs', async () => {
    setSelectResult([{ medications: MED, stock: STOCK }])
    const res = await request(app).get('/api/medication')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('returns 200 with empty list when none active', async () => {
    const res = await request(app).get('/api/medication')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

// ── GET /api/medication/alerts ────────────────────────────────────────────────

describe('GET /api/medication/alerts', () => {
  it('returns medications below threshold', async () => {
    const lowStock = { ...STOCK, quantity: 5, reorderThreshold: 14 }
    setSelectResult([{ medications: MED, stock: lowStock }])
    const res = await request(app).get('/api/medication/alerts')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('excludes medications above threshold', async () => {
    const okStock = { ...STOCK, quantity: 60, reorderThreshold: 14 }
    setSelectResult([{ medications: MED, stock: okStock }])
    const res = await request(app).get('/api/medication/alerts')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })
})

// ── GET /api/medication/:id ───────────────────────────────────────────────────

describe('GET /api/medication/:id', () => {
  it('returns 404 when not found', async () => {
    const res = await request(app).get('/api/medication/nonexistent')
    expect(res.status).toBe(404)
  })

  it('returns 200 with medication detail', async () => {
    setSelectResult([{ medications: MED, stock: STOCK }])
    const res = await request(app).get(`/api/medication/${MED.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(MED.id)
    expect(Array.isArray(res.body.data.recentLog)).toBe(true)
  })
})

// ── POST /api/medication ──────────────────────────────────────────────────────

describe('POST /api/medication', () => {
  it('returns 400 on invalid body', async () => {
    const res = await request(app)
      .post('/api/medication')
      .send({ dosage: '500mg' }) // missing name, frequency, person
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid body', async () => {
    setInsertResult([MED])
    const res = await request(app).post('/api/medication').send({
      name: MED.name,
      dosage: MED.dosage,
      frequency: MED.frequency,
      dosesPerDay: MED.dosesPerDay,
      person: MED.person,
    })
    expect(res.status).toBe(201)
    expect(res.body.data.id).toBe(MED.id)
  })
})

// ── PATCH /api/medication/:id ─────────────────────────────────────────────────

describe('PATCH /api/medication/:id', () => {
  it('returns 404 when not found', async () => {
    const res = await request(app)
      .patch(`/api/medication/${MED.id}`)
      .send({ name: 'Updated' })
    expect(res.status).toBe(404)
  })

  it('returns 200 with updated medication', async () => {
    setUpdateResult([{ ...MED, name: 'Updated' }])
    const res = await request(app)
      .patch(`/api/medication/${MED.id}`)
      .send({ name: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Updated')
  })
})

// ── DELETE /api/medication/:id ────────────────────────────────────────────────

describe('DELETE /api/medication/:id', () => {
  it('returns 404 when not found', async () => {
    const res = await request(app).delete(`/api/medication/${MED.id}`)
    expect(res.status).toBe(404)
  })

  it('returns 200 on deactivation', async () => {
    setUpdateResult([{ ...MED, active: false }])
    const res = await request(app).delete(`/api/medication/${MED.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
  })
})

// ── POST /api/medication/:id/log ──────────────────────────────────────────────

describe('POST /api/medication/:id/log', () => {
  it('returns 400 when action is invalid', async () => {
    setSelectResult([STOCK])
    const res = await request(app)
      .post(`/api/medication/${MED.id}/log`)
      .send({ action: 'eaten', quantityDelta: -1 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantityDelta is missing', async () => {
    setSelectResult([STOCK])
    const res = await request(app)
      .post(`/api/medication/${MED.id}/log`)
      .send({ action: 'taken' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when stock record does not exist', async () => {
    const res = await request(app)
      .post(`/api/medication/${MED.id}/log`)
      .send({ action: 'taken', quantityDelta: -1 })
    expect(res.status).toBe(404)
  })

  it('returns 201 for Log Taken action', async () => {
    setSelectResult([STOCK])
    setInsertResult([LOG_ENTRY])
    const res = await request(app)
      .post(`/api/medication/${MED.id}/log`)
      .send({ action: 'taken', quantityDelta: -1 })
    expect(res.status).toBe(201)
    expect(res.body.data.logEntry.action).toBe('taken')
    expect(res.body.data.newQuantity).toBe(59)
  })

  it('returns 201 for restocked action', async () => {
    setSelectResult([STOCK])
    setInsertResult([{ ...LOG_ENTRY, action: 'restocked', quantityDelta: 28 }])
    const res = await request(app)
      .post(`/api/medication/${MED.id}/log`)
      .send({ action: 'restocked', quantityDelta: 28 })
    expect(res.status).toBe(201)
    expect(res.body.data.newQuantity).toBe(88)
  })

  it('clamps quantity to 0 when delta makes it negative', async () => {
    setSelectResult([{ ...STOCK, quantity: 0 }])
    setInsertResult([LOG_ENTRY])
    const res = await request(app)
      .post(`/api/medication/${MED.id}/log`)
      .send({ action: 'taken', quantityDelta: -5 })
    expect(res.status).toBe(201)
    expect(res.body.data.newQuantity).toBe(0)
  })
})

// ── PATCH /api/medication/:id/stock ──────────────────────────────────────────

describe('PATCH /api/medication/:id/stock', () => {
  it('returns 400 on invalid body', async () => {
    const res = await request(app)
      .patch(`/api/medication/${MED.id}/stock`)
      .send({ reorderThreshold: -5 })
    expect(res.status).toBe(400)
  })

  it('returns 200 updating threshold', async () => {
    setUpdateResult([{ ...STOCK, reorderThreshold: 21 }])
    const res = await request(app)
      .patch(`/api/medication/${MED.id}/stock`)
      .send({ reorderThreshold: 21 })
    expect(res.status).toBe(200)
    expect(res.body.data.reorderThreshold).toBe(21)
  })
})
