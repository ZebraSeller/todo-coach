import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { setSessionUsername } from '../services/api'

type AuthMode = 'login' | 'register'

interface AuthPageProps {
  mode: AuthMode
}

export const AuthPage = ({ mode }: AuthPageProps) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLogin = mode === 'login'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Backend auth will be wired later.
      // For now we keep a lightweight client-side "session" using username,
      // so the app can read/write todos via the backend (Firestore).
      void password
      setSessionUsername(username)
      navigate('/app')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row"> {/* md: is for desktop */}
      <div className="flex-1 px-8 py-10 md:px-10 md:py-12 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-center gap-6 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/80">
          <span className="h-px w-6 bg-indigo-500/60 rounded-full" />
          Todo Coach
        </p>
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
            {isLogin ? 'Welcome back' : 'Create your space'}
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-md">
            An AI-assisted todo list that keeps your days organized and coach you on your progress.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <p className="font-medium text-slate-200">Plan</p>
            <p className="mt-1 text-[11px] text-slate-400">Group tasks by day.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <p className="font-medium text-slate-200">Prioritize</p>
            <p className="mt-1 text-[11px] text-slate-400">Let AI order your work.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <p className="font-medium text-slate-200">Reflect</p>
            <p className="mt-1 text-[11px] text-slate-400">Summaries per day.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 md:px-8 md:py-10 rounded-b-2xl md:rounded-l-none md:rounded-r-2xl bg-slate-900/80">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">
              {isLogin ? 'Log in to your account' : 'Register a new account'}
            </p>
            <p className="text-xs text-slate-400">
              Users are stored in Firestore (by username) when connected to the backend.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300 tracking-wide">
                Username
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300 tracking-wide">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-slate-50 shadow-lg shadow-indigo-900/40 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 transition-transform transition-colors"
            type="submit"
          >
            {loading ? (isLogin ? 'Signing you in…' : 'Creating account…') : isLogin ? 'Log in' : 'Sign up'}
          </motion.button>

          <p className="text-xs text-slate-400">
            {isLogin ? (
              <>
                Need an account?{' '}
                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Log in
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}

