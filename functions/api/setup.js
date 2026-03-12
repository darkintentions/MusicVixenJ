import { hashPassword, json, error } from './_utils.js'

// GET /api/setup — check if initial setup has been done
export async function onRequestGet(context) {
  const { env } = context
  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE role = 'teacher' LIMIT 1"
  ).first()
  return json({ setup: !!existing })
}

// POST /api/setup — create the first teacher account (one-time only)
export async function onRequestPost(context) {
  const { request, env } = context

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE role = 'teacher' LIMIT 1"
  ).first()

  if (existing) {
    return error('Setup already complete', 409)
  }

  const body = await request.json()
  const { username, password } = body

  if (!username?.trim() || !password) {
    return error('Username and password are required')
  }
  if (password.length < 6) {
    return error('Password must be at least 6 characters')
  }

  const hash = await hashPassword(password)
  await env.DB.prepare(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'teacher')"
  )
    .bind(username.trim(), hash)
    .run()

  return json({ ok: true })
}
