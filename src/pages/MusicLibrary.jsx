import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { apiFetch } from '../api'
import TagBadge from '../components/TagBadge'

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export default function MusicLibrary() {
  const [music, setMusic] = useState([])
  const [tags, setTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')
  const [showTagForm, setShowTagForm] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [m, t] = await Promise.all([apiFetch('/music'), apiFetch('/tags')])
    setMusic(m)
    setTags(t)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setUploadProgress('Extracting text from PDF...')

    try {
      let extractedText = ''
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          extractedText += content.items.map(item => item.str).join(' ') + '\n'
        }
      } catch {
        // Extraction failed — still upload the file
      }

      setUploadProgress('Uploading...')

      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name.replace(/\.pdf$/i, ''))
      form.append('extracted_text', extractedText.slice(0, 100000))

      const newMusic = await apiFetch('/music', { method: 'POST', body: form })
      setMusic(prev => [newMusic, ...prev])
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function createTag() {
    if (!newTagName.trim()) return
    try {
      const tag = await apiFetch('/tags', {
        method: 'POST',
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      })
      setTags(prev => [...prev, tag])
      setNewTagName('')
      setShowTagForm(false)
    } catch (err) {
      alert(err.message)
    }
  }

  async function deleteTag(id) {
    if (!confirm('Delete this tag? It will be removed from all music.')) return
    await apiFetch(`/tags/${id}`, { method: 'DELETE' })
    setTags(prev => prev.filter(t => t.id !== id))
    setMusic(prev =>
      prev.map(m => ({ ...m, tags: m.tags.filter(t => t.id !== id) }))
    )
    if (selectedTag === id) setSelectedTag(null)
  }

  const filtered = music.filter(m => {
    const matchTag = !selectedTag || m.tags.some(t => t.id === selectedTag)
    const matchSearch =
      !search || m.title.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Music Library</h1>
        <label
          className={`bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? uploadProgress || 'Uploading...' : '+ Upload PDF'}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Tags filter row */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !selectedTag
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({music.length})
        </button>

        {tags.map(t => (
          <div key={t.id} className="flex items-center">
            <button
              onClick={() => setSelectedTag(selectedTag === t.id ? null : t.id)}
              className={`px-3 py-1 rounded-l-full text-sm font-medium text-white transition-opacity ${
                selectedTag === t.id ? 'opacity-100 ring-2 ring-offset-1 ring-gray-400' : 'opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: t.color }}
            >
              {t.name}
            </button>
            <button
              onClick={() => deleteTag(t.id)}
              className="px-1.5 py-1 rounded-r-full text-white text-xs hover:opacity-70"
              style={{ backgroundColor: t.color }}
              title="Delete tag"
            >
              ×
            </button>
          </div>
        ))}

        {showTagForm ? (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createTag()
                if (e.key === 'Escape') setShowTagForm(false)
              }}
              placeholder="Tag name"
              className="border rounded px-2 py-1 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <input
              type="color"
              value={newTagColor}
              onChange={e => setNewTagColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border"
              title="Pick color"
            />
            <button
              onClick={createTag}
              className="text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowTagForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagForm(true)}
            className="px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 border border-dashed border-gray-300"
          >
            + New Tag
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by title..."
        className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Music list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {music.length === 0
              ? '📂 Upload your first PDF to get started.'
              : 'No music matches your search.'}
          </div>
        )}

        {filtered.map(m => (
          <Link
            key={m.id}
            to={`/music/${m.id}`}
            className="flex items-center justify-between bg-white border rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{m.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {m.filename} · {new Date(m.created_at).toLocaleDateString()}
              </div>
              {m.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.tags.map(t => (
                    <TagBadge key={t.id} tag={t} />
                  ))}
                </div>
              )}
            </div>
            <svg
              className="w-5 h-5 text-gray-300 flex-shrink-0 ml-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
