import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../App'
import TagBadge from '../components/TagBadge'
import PDFViewer from '../components/PDFViewer'

export default function MusicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'

  const [music, setMusic] = useState(null)
  const [allTags, setAllTags] = useState([])
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [tableRows, setTableRows] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [keysRows, setKeysRows] = useState(null)
  const [importKeysOpen, setImportKeysOpen] = useState(false)
  const [keysExpanded, setKeysExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState('pdf')
  const [tableFilter, setTableFilter] = useState('')

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    const m = await apiFetch(`/music/${id}`)
    setMusic(m)
    setTitle(m.title)
    setNotes(m.notes || '')
    if (m.table_data) {
      try { setTableRows(JSON.parse(m.table_data)) } catch { setTableRows([]) }
    } else {
      setTableRows([])
    }
    if (m.keys_data) {
      try { setKeysRows(JSON.parse(m.keys_data)) } catch { setKeysRows([]) }
    } else {
      setKeysRows([])
    }

    if (isTeacher) {
      const [tags, studs, asgns] = await Promise.all([
        apiFetch('/tags'),
        apiFetch('/students'),
        apiFetch('/assignments'),
      ])
      setAllTags(tags)
      setStudents(studs)
      setAssignments(asgns.filter(a => a.music_id === m.id))
    }
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const updated = await apiFetch(`/music/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          notes,
          table_data: tableRows?.length ? JSON.stringify(tableRows) : null,
          keys_data: keysRows?.length ? JSON.stringify(keysRows) : null,
        }),
      })
      setMusic(prev => ({ ...prev, ...updated }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleTsvPaste(e) {
    const text = e.clipboardData.getData('text')
    if (!text.trim()) return
    e.preventDefault()

    const rows = text
      .split(/\r?\n/)
      .map(line => line.split('\t'))
      .filter(row => row.some(cell => cell.trim()))

    if (!rows.length) return

    setTableRows(rows)
    setImportOpen(false)

    await apiFetch(`/music/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        notes,
        table_data: JSON.stringify(rows),
        keys_data: keysRows?.length ? JSON.stringify(keysRows) : null
      }),
    })
  }

  async function clearTable() {
    if (!confirm('Are you sure you want to clear the table? This cannot be undone.')) return
    setTableRows([])
    await apiFetch(`/music/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        notes,
        table_data: null,
        keys_data: keysRows?.length ? JSON.stringify(keysRows) : null
      }),
    })
  }

  async function handleKeysImport(e) {
    const text = e.clipboardData.getData('text')
    if (!text.trim()) return
    e.preventDefault()

    const rows = text
      .split(/\r?\n/)
      .map(line => line.split('\t'))
      .filter(row => row.some(cell => cell.trim()))

    if (!rows.length) return

    setKeysRows(rows)
    setImportKeysOpen(false)

    await apiFetch(`/music/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        notes,
        table_data: tableRows?.length ? JSON.stringify(tableRows) : null,
        keys_data: JSON.stringify(rows)
      }),
    })
  }

  async function clearKeys() {
    if (!confirm('Are you sure you want to clear the keys? This cannot be undone.')) return
    setKeysRows([])
    await apiFetch(`/music/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        notes,
        table_data: tableRows?.length ? JSON.stringify(tableRows) : null,
        keys_data: null
      }),
    })
  }

  async function toggleTag(tag) {
    const hasTag = music.tags.some(t => t.id === tag.id)
    const newTags = hasTag
      ? music.tags.filter(t => t.id !== tag.id)
      : [...music.tags, tag]

    await apiFetch(`/music/${id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagIds: newTags.map(t => t.id) }),
    })
    setMusic(prev => ({ ...prev, tags: newTags }))
  }

  async function toggleStudent(studentId) {
    const existing = assignments.find(a => a.student_id === studentId)
    if (existing) {
      await apiFetch(`/assignments/${existing.id}`, { method: 'DELETE' })
      setAssignments(prev => prev.filter(a => a.student_id !== studentId))
    } else {
      const a = await apiFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify({ music_id: Number(id), student_id: studentId }),
      })
      setAssignments(prev => [...prev, a])
    }
  }

  async function deleteMusic() {
    if (!confirm(`Delete "${music.title}"? This cannot be undone.`)) return
    await apiFetch(`/music/${id}`, { method: 'DELETE' })
    navigate('/library')
  }

  if (!music) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const unassignedTags = allTags.filter(t => !music.tags.some(mt => mt.id === t.id))

  return (
    <div className="px-6 py-6">
      <Link
        to={isTeacher ? '/library' : '/my-music'}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        ← Back
      </Link>

      <div className="flex gap-6 items-start">
        {/* Left: tabbed PDF / Table view */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex justify-center border-b mb-4">
            {['pdf', 'table'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'pdf' ? 'PDF' : 'Table'}
              </button>
            ))}
          </div>

          {/* PDF tab */}
          {activeTab === 'pdf' && <PDFViewer musicId={id} />}

          {/* Table tab */}
          {activeTab === 'table' && (
            <>
              {tableRows !== null && tableRows.length > 0 ? (
                (() => {
                  const maxCols = Math.max(...tableRows.map(r => r.length))
                  const dataRows = tableRows.slice(1)

                  // Collect unique first-letters from the last 3 columns of data rows
                  const filterLetters = [...new Set(
                    dataRows.flatMap(row =>
                      [maxCols - 3, maxCols - 2, maxCols - 1]
                        .filter(ci => ci >= 0)
                        .map(ci => (row[ci] ?? '').toString().trim()[0])
                        .filter(Boolean)
                    )
                  )].sort()

                  // Apply filter: keep rows where any of the last 3 cols starts with the chosen letter
                  const visibleRows = tableFilter
                    ? dataRows.filter(row =>
                        [maxCols - 3, maxCols - 2, maxCols - 1]
                          .filter(ci => ci >= 0)
                          .some(ci =>
                            (row[ci] ?? '').toString().trim().toLowerCase().startsWith(tableFilter.toLowerCase())
                          )
                      )
                    : dataRows

                  return (
                    <div className="bg-white border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-700" style={{ fontSize: 16 }}>
                          Table
                          <span className="ml-2 text-gray-400 font-normal" style={{ fontSize: 16 }}>
                            {visibleRows.length}{tableFilter ? `/${dataRows.length}` : ''} rows · {maxCols} columns
                          </span>
                        </h3>
                        <div className="flex items-center gap-3">
                          {/* Filter dropdown */}
                          <select
                            value={tableFilter}
                            onChange={e => setTableFilter(e.target.value)}
                            className="border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-600"
                            style={{ fontSize: 16 }}
                          >
                            <option value="">All</option>
                            {filterLetters.map(letter => (
                              <option key={letter} value={letter}>{letter}</option>
                            ))}
                          </select>
                          {isTeacher && (
                            <button
                              onClick={clearTable}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              style={{ fontSize: 16 }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ fontSize: 16 }}>
                          <thead>
                            <tr className="bg-gray-100">
                              {tableRows[0].map((cell, ci) => (
                                <th key={ci} className="border border-gray-200 px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                                  {cell}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRows.map((row, ri) => (
                              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {Array.from({ length: maxCols }).map((_, ci) => (
                                  <td key={ci} className="border border-gray-200 px-3 py-1.5 text-gray-700">
                                    {row[ci] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {visibleRows.length === 0 && (
                              <tr>
                                <td colSpan={maxCols} className="text-center py-6 text-gray-400 text-sm">
                                  No rows match "{tableFilter}"
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                  <p className="text-sm mb-1">No table yet.</p>
                  {isTeacher && (
                    <p className="text-xs">
                      Use the{' '}
                      <button
                        onClick={() => setImportOpen(true)}
                        className="text-indigo-500 hover:underline"
                      >
                        Import Table
                      </button>
                      {' '}button in the sidebar to paste TSV data.
                    </p>
                  )}
                </div>
              )}

              {/* Keys Table (collapsible) */}
              {keysRows !== null && keysRows.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setKeysExpanded(!keysExpanded)}
                    className="flex items-center gap-2 mb-3 text-gray-700 font-medium"
                  >
                    <span style={{ fontSize: 16 }}>
                      {keysExpanded ? '▼' : '▶'} Keys
                    </span>
                  </button>
                  {keysExpanded && (
                    <div className="bg-white border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-700" style={{ fontSize: 16 }}>
                          Keys
                          <span className="ml-2 text-gray-400 font-normal" style={{ fontSize: 16 }}>
                            {keysRows.length - 1} rows · {Math.max(...keysRows.map(r => r.length))} columns
                          </span>
                        </h3>
                        {isTeacher && (
                          <button
                            onClick={clearKeys}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            style={{ fontSize: 16 }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ fontSize: 16 }}>
                          <thead>
                            <tr className="bg-gray-100">
                              {keysRows[0].map((cell, ci) => (
                                <th key={ci} className="border border-gray-200 px-3 py-1.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                                  {cell}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {keysRows.slice(1).map((row, ri) => (
                              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {Array.from({ length: Math.max(...keysRows.map(r => r.length)) }).map((_, ci) => (
                                  <td key={ci} className="border border-gray-200 px-3 py-1.5 text-gray-700">
                                    {row[ci] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">

          {/* Title & Notes */}
          <div className="bg-white border rounded-xl p-4">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes about this piece..."
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setTitle(music.title); setNotes(music.notes || ''); setEditing(false) }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h2 className="font-semibold text-gray-900 leading-tight">{music.title}</h2>
                  {isTeacher && (
                    <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 hover:underline flex-shrink-0">
                      Edit
                    </button>
                  )}
                </div>
                {music.notes && <p className="text-sm text-gray-500 mt-2">{music.notes}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {music.filename} · {new Date(music.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Tags (teacher only) */}
          {isTeacher && (
            <div className="bg-white border rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
              {music.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {music.tags.map(t => (
                    <TagBadge key={t.id} tag={t} onRemove={() => toggleTag(t)} />
                  ))}
                </div>
              )}
              {unassignedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {unassignedTags.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleTag(t)}
                      className="text-xs px-2 py-0.5 rounded-full border border-dashed text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                    >
                      + {t.name}
                    </button>
                  ))}
                </div>
              )}
              {allTags.length === 0 && (
                <p className="text-xs text-gray-400">
                  No tags yet. Create tags in the{' '}
                  <Link to="/library" className="text-indigo-600 hover:underline">library</Link>.
                </p>
              )}
            </div>
          )}

          {/* Tags (student — read only) */}
          {!isTeacher && music.tags.length > 0 && (
            <div className="bg-white border rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {music.tags.map(t => <TagBadge key={t.id} tag={t} />)}
              </div>
            </div>
          )}

          {/* Assign Students (teacher only) */}
          {isTeacher && (
            <div className="bg-white border rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Students ({assignments.length} assigned)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map(s => {
                  const assigned = assignments.some(a => a.student_id === s.id)
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => toggleStudent(s.id)}
                        className="rounded text-indigo-600"
                      />
                      <span className={assigned ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                        {s.username}
                      </span>
                    </label>
                  )
                })}
                {students.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No students yet.{' '}
                    <Link to="/students" className="text-indigo-600 hover:underline">Add students</Link>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Keys + Import Table + Delete (teacher only) */}
          {isTeacher && (
            <>
              <button
                onClick={() => setImportKeysOpen(true)}
                className="w-full text-sm text-indigo-600 hover:text-indigo-800 py-2 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Import Keys
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="w-full text-sm text-indigo-600 hover:text-indigo-800 py-2 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Import Table
              </button>
              <button
                onClick={deleteMusic}
                className="w-full text-sm text-red-500 hover:text-red-700 py-2 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                Delete Music
              </button>
            </>
          )}
        </div>
      </div>

      {/* Import Table modal */}
      {importOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) setImportOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Import Table</h2>
              <button
                onClick={() => setImportOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Copy cells from Excel or Google Sheets, then paste into the box below. The modal will close automatically once data is detected.
            </p>
            <textarea
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-gray-400"
              rows={5}
              placeholder="Paste TSV data here (Ctrl+V / Cmd+V)…"
              onPaste={handleTsvPaste}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setImportOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Keys modal */}
      {importKeysOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) setImportKeysOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Import Keys</h2>
              <button
                onClick={() => setImportKeysOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Copy cells from Excel or Google Sheets, then paste into the box below. The modal will close automatically once data is detected.
            </p>
            <textarea
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-gray-400"
              rows={5}
              placeholder="Paste TSV data here (Ctrl+V / Cmd+V)…"
              onPaste={handleKeysImport}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setImportKeysOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
