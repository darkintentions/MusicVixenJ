import { useState, useEffect } from 'react'

export default function PDFViewer({ musicId }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let objectUrl = null

    async function loadPdf() {
      setLoading(true)
      setErr(null)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/music/${musicId}/file`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Could not load PDF')
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    }

    loadPdf()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [musicId])

  if (loading) {
    return (
      <div className="border rounded-xl bg-gray-50 flex items-center justify-center" style={{ height: 875 }}>
        <div className="text-gray-400 text-sm">Loading PDF...</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="border rounded-xl bg-red-50 flex items-center justify-center" style={{ height: 875 }}>
        <div className="text-red-500 text-sm">{err}</div>
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-hidden" style={{ height: 875 }}>
      <iframe
        src={pdfUrl}
        className="w-full h-full"
        title="PDF Viewer"
      />
    </div>
  )
}
