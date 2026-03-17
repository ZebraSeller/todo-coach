import type { TodoItem } from '../pages/TodoPage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function getUsername(): string {
  const u = localStorage.getItem('tc_username') || ''
  return u
}

function authHeaders(): HeadersInit {
  const username = getUsername()
  return username ? { 'x-username': username } : {}
}

async function parseJsonOrThrow(res: Response) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = (data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export async function fetchTodos(): Promise<TodoItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/todos`, {
    headers: {
      ...authHeaders(),
    },
  })
  const data = await parseJsonOrThrow(res)
  return Array.isArray(data?.todos) ? (data.todos as TodoItem[]) : []
}

export async function addTodo(todo: Pick<TodoItem, 'taskName' | 'date'>): Promise<TodoItem> {
  const res = await fetch(`${API_BASE_URL}/api/todos`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ op: 'add', todo }),
  })
  const data = await parseJsonOrThrow(res)
  return data.todo as TodoItem
}

export async function deleteTodo(todoID: string): Promise<TodoItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/todos`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ op: 'delete', todoID }),
  })
  const data = await parseJsonOrThrow(res)
  return Array.isArray(data?.todos) ? (data.todos as TodoItem[]) : []
}

export async function toggleTodo(todoID: string, completed: boolean): Promise<TodoItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/todos`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ op: 'toggle', todoID, completed }),
  })
  const data = await parseJsonOrThrow(res)
  return Array.isArray(data?.todos) ? (data.todos as TodoItem[]) : []
}

export async function summarize(tasks: TodoItem[]): Promise<{ summary: string; suggestedOrder?: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/summarize`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ tasks }),
  })
  const data = await parseJsonOrThrow(res)
  return { summary: String(data.summary || ''), suggestedOrder: Array.isArray(data.suggestedOrder) ? data.suggestedOrder : undefined }
}

export async function register(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  await parseJsonOrThrow(res)
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  await parseJsonOrThrow(res)
}

export function setSessionUsername(username: string) {
  localStorage.setItem('tc_username', username)
}

export function clearSession() {
  localStorage.removeItem('tc_username')
}

export function getSessionUsername() {
  return localStorage.getItem('tc_username')
}

