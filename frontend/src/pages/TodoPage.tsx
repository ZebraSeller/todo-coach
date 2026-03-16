import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mockAddTodo, mockDeleteTodo, mockGetTodos, mockSummarize, mockToggleTodo } from '../services/mockApi'

export interface TodoItem {
  todoID: string
  taskName: string
  date: string // YYYY-MM-DD
  completed?: boolean
}

type GroupedTodos = Record<string, TodoItem[]>

export const TodoPage = () => {
  const navigate = useNavigate()
  const [todos, setTodos] = useState<TodoItem[]>(mockGetTodos())
  const [newTask, setNewTask] = useState('')
  const [newTaskDate, setNewTaskDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [summaryDate, setSummaryDate] = useState<string | null>(null)
  const [summaryText, setSummaryText] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const groups: GroupedTodos = useMemo(() => {
    return todos.reduce((acc, t) => {
      if (!acc[t.date]) acc[t.date] = []
      acc[t.date].push(t)
      return acc
    }, {} as GroupedTodos)
  }, [todos])

  const sortedDates = Object.keys(groups).sort()

  const handleAdd = () => {
    if (!newTask.trim()) return
    const created = mockAddTodo({ taskName: newTask.trim(), date: newTaskDate })
    setTodos((prev) => [...prev, created])
    setNewTask('')
  }

  const handleDelete = (id: string) => {
    mockDeleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.todoID !== id))
  }

  const handleToggleDone = (id: string) => {
    mockToggleTodo(id)
    setTodos((prev) =>
      prev.map((t) => (t.todoID === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const openSummary = async (date: string) => {
    setSummaryDate(date)
    setSummaryText(null)
    setSummaryLoading(true)
    try {
      const summary = await mockSummarize(groups[date])
      setSummaryText(summary)
    } finally {
      setSummaryLoading(false)
    }
  }

  const closeSummary = () => {
    setSummaryDate(null)
    setSummaryText(null)
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            Your todos
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Tasks are grouped by date. Use the summarize button to get AI guidance (mocked for now).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[11px] text-slate-300">
            Frontend prototype · Mock API
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center rounded-xl bg-slate-800/90 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 transition-transform transition-colors"
          >
            Logout
          </motion.button>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-4 md:px-5 md:py-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1 space-y-2">
          <label className="block text-xs font-medium text-slate-300 tracking-wide">
            Task
          </label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="Prepare design review, write tests, plan sprint..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
        </div>
        <div className="w-full md:w-40 space-y-2">
          <label className="block text-xs font-medium text-slate-300 tracking-wide">
            Date
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
          />
        </div>
        <div className="flex md:self-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="inline-flex w-full md:w-auto items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-slate-50 shadow-lg shadow-indigo-900/40 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 transition-transform transition-colors"
          >
            Add task
          </motion.button>
        </div>
      </div>

      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {sortedDates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400">
            No tasks yet. Add your first task above.
          </div>
        )}

        {sortedDates.map((date) => (
          <section
            key={date}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 md:px-5 md:py-4 space-y-3"
          >
            {(() => {
              const allDone = groups[date].every((t) => t.completed)
              return (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <h2
                      className={
                        'text-sm md:text-base font-semibold ' +
                        (allDone ? 'text-emerald-300' : 'text-slate-50')
                      }
                    >
                      {date} {allDone && <span className="text-[11px]">(Done!)</span>}
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      {groups[date].length} task{groups[date].length !== 1 && 's'}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openSummary(date)}
                    className="inline-flex items-center justify-center rounded-xl border border-indigo-500/60 bg-indigo-950/50 px-3 py-1.5 text-[11px] font-medium text-indigo-200 shadow-md shadow-indigo-900/40 hover:bg-indigo-900/60 transition-transform transition-colors"
                  >
                    Summarize with AI
                  </motion.button>
                </div>
              )
            })()}

            <ul className="space-y-1.5">
              {groups[date].map((todo) => (
                <li
                  key={todo.todoID}
                  className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 text-sm"
                >
                  <span
                    className={
                      'flex-1 pr-2 ' +
                      (todo.completed ? 'text-emerald-300 line-through' : 'text-slate-100')
                    }
                  >
                    {todo.taskName}
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleDone(todo.todoID)}
                      className={
                        'inline-flex items-center justify-center rounded-lg px-2 py-1 text-[11px] font-medium transition-transform transition-colors ' +
                        (todo.completed
                          ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-500/60'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80')
                      }
                    >
                      {todo.completed ? '✓' : 'Mark as done'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(todo.todoID)}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700/80 transition-transform transition-colors"
                    >
                      Delete
                    </motion.button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {summaryDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl shadow-black/60 p-5 md:p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/80">
                  Gemini summary
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  Plan for {summaryDate}
                </h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeSummary}
                className="rounded-xl bg-slate-900/80 border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800/80 transition-transform transition-colors"
              >
                Close
              </motion.button>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3.5 py-3 text-sm text-slate-200 max-h-60 overflow-y-auto">
              {summaryLoading && <p className="text-slate-400 text-sm">Calling Vertex AI (mock)…</p>}
              {!summaryLoading && summaryText && (
                <p className="whitespace-pre-line text-sm text-slate-200">{summaryText}</p>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              This call uses a mocked `/api/summarize` endpoint in the frontend. The real backend will
              send your tasks to Vertex AI Gemini 1.5 Flash and return a summary plus suggested order.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}

