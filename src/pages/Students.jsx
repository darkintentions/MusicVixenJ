import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

export default function Students() {
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [allMusic, setAllMusic] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => {
    Promise.all([
      apiFetch('/students'),
      apiFetch('/assignments'),
      apiFetch('/music'),
    ]).then(([s, a, m]) => {
      setStudents(s)
      setAssignments(a)
      setAllMusic(m)
    })
  }, [])

  async function createStudent(e) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const student = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setStudents(prev => [...prev, student])
      setUsername('')
      setPassword('')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const studentAssignments = selectedStudent
    ? assignments.filter(a => a.student_id === selectedStudent.id)
    : []

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Students</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create student form */}
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Add Student</h2>
          <form onSubmit={createStudent} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6}
            />
            {errorMsg && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                {errorMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Students list */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">
            Students ({students.length})
          </h2>
          <div className="space-y-2">
            {students.map(s => {
              const count = assignments.filter(a => a.student_id === s.id).length
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(selectedStudent?.id === s.id ? null : s)}
                  className={`w-full text-left bg-white border rounded-xl p-3 hover:border-indigo-300 transition-all ${
                    selectedStudent?.id === s.id ? 'border-indigo-500 shadow-sm' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">🎓 {s.username}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {count} piece{count !== 1 ? 's' : ''} assigned ·{' '}
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </button>
              )
            })}
            {students.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No students yet.</p>
            )}
          </div>
        </div>

        {/* Selected student's assignments */}
        {selectedStudent && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">
              {selectedStudent.username}'s Music
            </h2>
            <div className="space-y-2">
              {studentAssignments.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Nothing assigned yet.</p>
              )}
              {studentAssignments.map(a => (
                <Link
                  key={a.id}
                  to={`/music/${a.music_id}`}
                  className="block bg-white border rounded-xl p-3 hover:border-indigo-300 transition-all"
                >
                  <div className="text-sm font-medium text-gray-900">{a.music_title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Assigned {new Date(a.assigned_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Assign music from each{' '}
              <Link to="/library" className="text-indigo-600 hover:underline">
                music piece's detail page
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
