import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dashboardSchema from './schema/dashboard'
import * as knowledgeSchema from './schema/knowledge'

const client = postgres(
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/life_platform',
  { max: 5 },
)

export const db = drizzle(client, { schema: { ...dashboardSchema, ...knowledgeSchema } })
