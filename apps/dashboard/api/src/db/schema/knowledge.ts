import { pgSchema, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const knowledgeSchema = pgSchema('knowledge')

export const topics = knowledgeSchema.table('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  status: text('status').notNull().default('not_started'),
  progress: integer('progress').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const resources = knowledgeSchema.table('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id')
    .notNull()
    .references(() => topics.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url'),
  resourceType: text('resource_type').notNull().default('article'),
  notes: text('notes'),
  completed: boolean('completed').notNull().default(false),
  filePath: text('file_path'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const notes = knowledgeSchema.table('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id')
    .notNull()
    .references(() => topics.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
