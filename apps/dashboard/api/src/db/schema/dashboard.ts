import { pgSchema, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const dashboardSchema = pgSchema('dashboard')

export const favourites = dashboardSchema.table('favourites', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  iconType: text('icon_type').notNull().default('favicon'),
  iconValue: text('icon_value'),
  colour: text('colour'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
