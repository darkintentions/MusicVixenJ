import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function navClass(path) {
    return location.pathname === path
      ? 'text-indigo-600 font-semibold'
      : 'text-gray-600 hover:text-gray-900'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-6 z-50 shadow-sm">
      <Link to="/" className="text-lg font-bold text-indigo-600 flex items-center gap-2">
        🎵 Music Library
      </Link>

      <div className="flex items-center gap-5 ml-2">
        {user?.role === 'teacher' ? (
          <>
            <Link to="/library" className={navClass('/library')}>
              Library
            </Link>
            <Link to="/students" className={navClass('/students')}>
              Students
            </Link>
            <Link to="/dashboard" className={navClass('/dashboard')}>
              Dashboard
            </Link>
          </>
        ) : (
          <Link to="/my-music" className={navClass('/my-music')}>
            My Music
          </Link>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:inline">
          {user?.role === 'teacher' ? '👩‍🏫' : '🎓'} {user?.username}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
