import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from './pages/AuthPage'
import { TodoPage } from './pages/TodoPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-5xl rounded-2xl bg-slate-900/60 border border-slate-800 shadow-2xl shadow-indigo-900/100 backdrop-blur-md">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/app" element={<TodoPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
