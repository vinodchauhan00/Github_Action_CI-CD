import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'

const here = path.dirname(fileURLToPath(import.meta.url))

export function createApp({ dataFile } = {}) {
  const file = dataFile || process.env.DATA_FILE || path.join(here, '../data/notes.json')
  const load = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return [] } }
  const save = (notes) => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(notes, null, 2))
  }

  const app = express()
  app.use(express.json({ limit: '10kb' }))
  app.use(express.static(path.join(here, '../public')))

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()) }))

  // shows which commit is running: handy to confirm a deployment worked
  app.get('/api/version', (_req, res) =>
    res.json({ version: process.env.APP_VERSION || '1.0.0', commit: process.env.GIT_SHA || 'local' }))

  app.get('/api/notes', (_req, res) => res.json(load()))

  app.post('/api/notes', (req, res) => {
    const text = String(req.body?.text ?? '').trim()
    if (!text || text.length > 200) return res.status(400).json({ error: 'Text is required (max 200 chars).' })
    const note = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }
    const notes = load(); notes.unshift(note); save(notes)
    res.status(201).json(note)
  })

  app.delete('/api/notes/:id', (req, res) => {
    const notes = load()
    const next = notes.filter((n) => n.id !== req.params.id)
    if (next.length === notes.length) return res.status(404).json({ error: 'Not found' })
    save(next)
    res.status(204).end()
  })

  return app
}
