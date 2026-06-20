import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { favouritesRouter } from './routes/favourites'
import { healthRouter } from './routes/health'
import { knowledgeRouter } from './routes/knowledge'

export const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/favourites', favouritesRouter)
app.use('/api/knowledge', knowledgeRouter)

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT ?? 3001
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`)
  })
}
