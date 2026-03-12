import { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../App'
import TagBadge from '../components/TagBadge'
import PDFViewer from '../components/PDFViewer'

export default function StudentView() {
  const { user } = useAuth()
  const [music, setMusic] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/my-music')
      .then(data => {
        setMusic(data)
        if (data.length > 0) setSelected(data[0])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Music</h1>
        <p className="text-sm text-gray-500 mt-1">
          {music.length} piece{music.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {music.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-3">🎵</div>
          <p>No music assigned yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Music list */}
          <div className="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
            {music.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full text-left bg-white border rounded-xl p-4 hover:border-indigo-300 transition-all ${
                  selected?.id === m.id ? 'border-indigo-500 shadow-sm' : ''
                }`}
              >
                <div className="font-medium text-gray-900 text-sm leading-tight">
                  {m.title}
                </div>
                {m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.tags.map(t => (
                      <TagBadge key={t.id} tag={t} />
                    ))}
                  </div>
                )}
                {m.assignment_notes && (
                  <p className="text-xs text-gray-500 mt-2 italic border-t pt-2">
                    📝 {m.assignment_notes}
                  </p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Assigned {new Date(m.assigned_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            {selected ? (
              <>
                <h2 className="font-semibold text-gray-900 mb-3">{selected.title}</h2>
                <PDFViewer musicId={selected.id} />
              </>
            ) : (
              <div
                className="border rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"
                style={{ height: 700 }}
              >
                Select a piece to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
