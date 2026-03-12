const BASE = '/api'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')

  const headers = { ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  // Don't set Content-Type for FormData — browser handles boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    const e = new Error(err.error || 'Request failed')
    e.status = res.status
    throw e
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}
