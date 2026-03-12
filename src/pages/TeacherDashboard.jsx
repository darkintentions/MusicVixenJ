import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../App'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentMusic, setRecentMusic] = useState([])

  useEffect(() => {
    Promise.all([
      apiFetch('/music'),
      apiFetch('/students'),
      apiFetch('/assignments'),
    ]).then(([music, students, assignments]) => {
      setStats({
        music: music.length,
        students: students.length,
        assignments: assignments.length,
      })
      setRecentMusic(music.slice(0, 5))
    })
  }, [])

  const statCards = [
    {
      label: 'Music Pieces',
      value: stats?.music,
      icon: '🎵',
      link: '/library',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    {
      label: 'Students',
      value: stats?.students,
      icon: '🎓',
      link: '/students',
      color: 'bg-green-50 text-green-700 border-green-100',
    },
    {
      label: 'Assignments',
      value: stats?.assignments,
      icon: '📋',
      link: '/students',
      color: 'bg-amber-50 text-amber-700 border-amber-100',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's an overview of your music library.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(s => (
          <Link
            key={s.label}
            to={s.link}
            className={`${s.color} border rounded-xl p-5 hover:opacity-80 transition-opacity`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold">{stats ? s.value : '—'}</div>
            <div className="text-sm font-medium mt-0.5 opacity-80">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <Link
          to="/library"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Upload Music
        </Link>
        <Link
          to="/students"
          className="bg-white border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Add Students
        </Link>
      </div>

      {recentMusic.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Recent Uploads</h2>
          <div className="space-y-2">
            {recentMusic.map(m => (
              <Link
                key={m.id}
                to={`/music/${m.id}`}
                className="flex items-center justify-between bg-white border rounded-xl px-4 py-3 hover:border-indigo-300 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
