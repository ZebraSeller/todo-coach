// Load env vars (GOOGLE_APPLICATION_CREDENTIALS, etc.) before anything else.
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import express from 'express'
import cors from 'cors'
import { FieldValue } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { getDb } from './firebase'
import type { TodoItem, UserDoc } from './types'
import { VertexAI } from '@google-cloud/vertexai'

const app = express()

// Initialize Vertex AI (Gemini)
const gcpProject = process.env.GOOGLE_CLOUD_PROJECT
if (!gcpProject) {
  // eslint-disable-next-line no-console
  console.warn('GOOGLE_CLOUD_PROJECT is not set. /api/summarize will fail until it is configured.')
}

const vertexAI = new VertexAI({
  project: gcpProject || '',
  location: process.env.VERTEX_LOCATION || 'us-central1',
})

const generativeModel = vertexAI.getGenerativeModel({
  // Vertex requires a versioned publisher model name in many projects, e.g. gemini-1.5-flash-001.
  model: process.env.VERTEX_MODEL || 'gemini-2.5-flash-lite',
})

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Hello, you reached the backend!' })
})

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.post('/api/register', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!username) return res.status(400).json({ error: 'Username is required' })
  if (!password) return res.status(400).json({ error: 'Password is required' })

  const db = getDb()
  const userRef = db.collection('users').doc(username)
  const snap = await userRef.get()

  if (snap.exists) {
    return res.status(409).json({ error: 'Username already exists' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const doc: UserDoc = { username, password: hashed, todoList: [] }
  await userRef.set(doc)

  return res.status(201).json({ ok: true })
})

app.post('/api/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!username) return res.status(400).json({ error: 'Username is required' })
  if (!password) return res.status(400).json({ error: 'Password is required' })

  const db = getDb()
  const userRef = db.collection('users').doc(username)
  const snap = await userRef.get()

  if (!snap.exists) {
    return res.status(404).json({ error: "Username doesn't exist" })
  }

  const data = snap.data() as Partial<UserDoc> | undefined
  const hash = typeof data?.password === 'string' ? data.password : ''
  if (!hash) {
    return res.status(500).json({ error: 'User record is missing password hash' })
  }

  const ok = await bcrypt.compare(password, hash)
  if (!ok) {
    return res.status(401).json({ error: 'Password is wrong' })
  }

  return res.status(200).json({ ok: true })
})

function getUsernameFromReq(req: express.Request): string | null {
  const fromHeader = req.header('x-username')
  if (fromHeader && fromHeader.trim()) return fromHeader.trim()

  const q = req.query.username
  if (typeof q === 'string' && q.trim()) return q.trim()

  return null
}

app.get('/api/todos', async (req, res) => {
  const username = getUsernameFromReq(req)
  if (!username) {
    return res.status(400).json({ error: 'Missing username. Provide ?username=... or x-username header.' })
  }

  const db = getDb()
  const userRef = db.collection('users').doc(username)
  const snap = await userRef.get()

  if (!snap.exists) {
    return res.status(404).json({ error: "Username doesn't exist" })
  }

  const data = snap.data() as Partial<UserDoc> | undefined
  const todos = Array.isArray(data?.todoList) ? (data!.todoList as TodoItem[]) : []
  return res.status(200).json({ todos })
})

app.post('/api/todos', async (req, res) => { // Endpoint for adding, deleting, and toggling todos
  const username = getUsernameFromReq(req) || (typeof req.body?.username === 'string' ? req.body.username : null)
  if (!username) {
    return res.status(400).json({ error: 'Missing username. Provide body.username, ?username=..., or x-username.' })
  }

  const op = typeof req.body?.op === 'string' ? req.body.op : 'add'

  const rawTodo = req.body?.todo
  const taskName = typeof rawTodo?.taskName === 'string' ? rawTodo.taskName.trim() : ''
  const date = typeof rawTodo?.date === 'string' ? rawTodo.date.trim() : ''
  const completed = typeof rawTodo?.completed === 'boolean' ? rawTodo.completed : false
  const todoID = typeof rawTodo?.todoID === 'string' && rawTodo.todoID.trim() ? rawTodo.todoID.trim() : randomUUID()

  const db = getDb()
  const userRef = db.collection('users').doc(username)

  if (op === 'delete') {
    const targetId = typeof req.body?.todoID === 'string' ? req.body.todoID : ''
    if (!targetId) return res.status(400).json({ error: 'Missing todoID for delete' })

    const nextTodos = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const data = snap.data() as Partial<UserDoc> | undefined
      const current = Array.isArray(data?.todoList) ? (data!.todoList as TodoItem[]) : []
      const updated = current.filter((t) => t.todoID !== targetId)
      tx.set(userRef, { username, todoList: updated }, { merge: true })
      return updated
    })

    return res.status(200).json({ todos: nextTodos })
  }

  if (op === 'toggle') {
    const targetId = typeof req.body?.todoID === 'string' ? req.body.todoID : ''
    const nextCompleted = typeof req.body?.completed === 'boolean' ? req.body.completed : null
    if (!targetId) return res.status(400).json({ error: 'Missing todoID for toggle' })
    if (nextCompleted === null) return res.status(400).json({ error: 'Missing completed boolean for toggle' })

    const nextTodos = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const data = snap.data() as Partial<UserDoc> | undefined
      const current = Array.isArray(data?.todoList) ? (data!.todoList as TodoItem[]) : []
      const updated = current.map((t) => (t.todoID === targetId ? { ...t, completed: nextCompleted } : t))
      tx.set(userRef, { username, todoList: updated }, { merge: true })
      return updated
    })

    return res.status(200).json({ todos: nextTodos })
  }

  // default: add
  if (!taskName) return res.status(400).json({ error: 'todo.taskName is required' })
  if (!date) return res.status(400).json({ error: 'todo.date is required (YYYY-MM-DD)' })

  const todo: TodoItem = { todoID, taskName, date, completed }

  await userRef.set(
    {
      username,
      todoList: FieldValue.arrayUnion(todo),
    },
    { merge: true },
  )

  return res.status(201).json({ todo })
})

app.post('/api/summarize', async (req, res) => {
  const todos: unknown = req.body?.todos ?? req.body?.tasks

  if (!Array.isArray(todos)) {
    return res.status(400).json({ error: 'Todos array is required' })
  }

  const safeTodos = todos
    .filter((t) => t && typeof t === 'object')
    .map((t: any) => ({
      taskName: typeof t.taskName === 'string' ? t.taskName : '',
      completed: Boolean(t.completed),
    }))
    .filter((t) => t.taskName.trim().length > 0)

  if (safeTodos.length === 0) {
    return res.status(200).json({ summary: "No tasks found for this date. Add a task, then try summarizing again." })
  }

  const todoText = safeTodos
    .map((t) => `- ${t.taskName} (${t.completed ? 'Done' : 'Pending'})`)
    .join('\n')

  const prompt = [
    'You are a professional productivity coach.',
    "Here is a user's task list for a single day:",
    todoText,
    '',
    'Return plain text with this format:',
    'Summary: <2 encouraging sentences>',
    'Tips:',
    '- <tip 1>',
    '- <tip 2>',
    '- <tip 3>',
  ].join('\n')

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
    })

    const text =
      result.response?.candidates?.[0]?.content?.parts
        ?.map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
        .join('') || ''

    if (!text.trim()) {
      return res.status(502).json({ error: 'Vertex AI returned an empty response' })
    }

    return res.status(200).json({ summary: text.trim() })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Gemini Error:', error)
    const message =
      error && typeof (error as any).message === 'string'
        ? (error as any).message
        : 'Unknown error'

    return res.status(500).json({
      error:
        'Failed to generate summary. Verify Vertex AI is enabled, your service account has permissions, and VERTEX_MODEL/VERTEX_LOCATION are correct.',
      details: {
        vertexModel: process.env.VERTEX_MODEL || 'gemini-1.5-flash-001',
        vertexLocation: process.env.VERTEX_LOCATION || 'us-central1',
        message,
      },
    })
  }
})

// this is the port that the backend will listen on keeping the server awake.
const port = Number(process.env.PORT) || 8080
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${port}`)
})

