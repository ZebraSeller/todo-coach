import { v4 as uuid } from 'uuid'
import type { TodoItem } from '../pages/TodoPage'

interface AuthPayload {
  username: string
  password: string
}

let todosStore: TodoItem[] = [
  {
    todoID: uuid(),
    taskName: 'Plan sprint backlog',
    date: new Date().toISOString().slice(0, 10),
    completed: false,
  },
  {
    todoID: uuid(),
    taskName: 'Write tests for auth API',
    date: new Date().toISOString().slice(0, 10),
    completed: false,
  },
]

export function mockLogin(payload: AuthPayload): Promise<void> {
  void payload
  return new Promise((resolve) => setTimeout(resolve, 600))
}

export function mockRegister(payload: AuthPayload): Promise<void> {
  void payload
  return new Promise((resolve) => setTimeout(resolve, 700))
}

export function mockGetTodos(): TodoItem[] {
  return todosStore
}

export function mockAddTodo(input: { taskName: string; date: string }): TodoItem {
  const todo: TodoItem = {
    todoID: uuid(),
    taskName: input.taskName,
    date: input.date,
    completed: false,
  }
  todosStore = [...todosStore, todo]
  return todo
}

export function mockDeleteTodo(todoID: string): void {
  todosStore = todosStore.filter((t) => t.todoID !== todoID)
}

export function mockToggleTodo(todoID: string): void {
  todosStore = todosStore.map((t) =>
    t.todoID === todoID ? { ...t, completed: !t.completed } : t,
  )
}

export async function mockSummarize(tasks: TodoItem[]): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  if (!tasks.length) {
    return 'There are no tasks scheduled for this day yet.'
  }

  const names = tasks.map((t) => `• ${t.taskName}`).join('\n')
  return [
    'Here is a mock Gemini 1.5 Flash summary of your day:',
    '',
    names,
    '',
    'Suggested order:',
    '1) Start with any deep-work tasks that require focus.',
    '2) Batch similar tasks together (e.g., reviews, writing, meetings).',
    '3) Reserve the last slot of the day for small, quick wins and housekeeping.',
  ].join('\n')
}

