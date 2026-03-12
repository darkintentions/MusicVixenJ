import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useState } from 'react'
import Login from './pages/Login'
import Setup from './pages/Setup'
import TeacherDashboard from './pages/TeacherDashboard'
import MusicLibrary from './pages/MusicLibrary'
import MusicDetail from './pages/MusicDetail'
import Students from './pages/Students'
import StudentView from './pages/StudentView'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  function login(userData, token) {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        {user && <Navbar />}
        <div className={user ? 'pt-16' : ''}>
          <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {user?.role === 'teacher' ? (
                    <Navigate to="/library" replace />
                  ) : (
                    <Navigate to="/my-music" replace />
                  )}
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute role="teacher">
                  <MusicLibrary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/music/:id"
              element={
                <ProtectedRoute>
                  <MusicDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute role="teacher">
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-music"
              element={
                <ProtectedRoute role="student">
                  <StudentView />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
