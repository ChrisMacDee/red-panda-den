import { pgSchema, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const medicationSchema = pgSchema('medication')

export const medications = medicationSchema.table('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  dosesPerDay: integer('doses_per_day').notNull().default(1),
  person: text('person').notNull(),
  prescriber: text('prescriber'),
  pharmacy: text('pharmacy'),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const stock = medicationSchema.table('stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  medicationId: uuid('medication_id')
    .notNull()
    .unique()
    .references(() => medications.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  unit: text('unit').notNull().default('tablets'),
  reorderThreshold: integer('reorder_threshold').notNull().default(14),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const medLog = medicationSchema.table('log', {
  id: uuid('id').primaryKey().defaultRandom(),
  medicationId: uuid('medication_id')
    .notNull()
    .references(() => medications.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  notes: text('notes'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
})
