import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from '../src/app.js'

let server, base, dir

test.before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-'))
  const app = createApp({ dataFile: path.join(dir, 'notes.json') })
  await new Promise((resolve) => { server = app.listen(0, resolve) })
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }) })

const json = (method, url, body) =>
  fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })

test('health endpoint is ok', async () => {
  const res = await fetch(`${base}/api/health`)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).status, 'ok')
})

test('version endpoint reports a commit', async () => {
  const data = await (await fetch(`${base}/api/version`)).json()
  assert.ok(data.commit)
})

test('create, list and delete a note', async () => {
  const created = await json('POST', '/api/notes', { text: 'learn GitHub Actions' })
  assert.equal(created.status, 201)
  const note = await created.json()

  const list = await (await fetch(`${base}/api/notes`)).json()
  assert.equal(list.length, 1)
  assert.equal(list[0].text, 'learn GitHub Actions')

  assert.equal((await json('DELETE', `/api/notes/${note.id}`)).status, 204)
  assert.equal((await (await fetch(`${base}/api/notes`)).json()).length, 0)
})

test('rejects empty and too-long notes', async () => {
  assert.equal((await json('POST', '/api/notes', { text: '   ' })).status, 400)
  assert.equal((await json('POST', '/api/notes', { text: 'x'.repeat(201) })).status, 400)
})

test('deleting an unknown note returns 404', async () => {
  assert.equal((await json('DELETE', '/api/notes/nope')).status, 404)
})
