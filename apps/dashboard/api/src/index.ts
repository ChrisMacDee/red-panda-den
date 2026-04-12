import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

export const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT ?? 3001
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`)
  })
}
