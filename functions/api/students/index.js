import { json, error, hashPassword } from '../_utils.js'

export async function onRequestGet(context) {
  const { env, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { results } = await env.DB.prepare(
    "SELECT id, username, created_at FROM users WHERE role = 'student' ORDER BY username"
  ).all()

  return json(results)
}

export async function onRequestPost(context) {
  const { request, env, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { username, password } = await request.json()

  if (!username?.trim()) return error('Username is required')
  if (!password || password.length < 6) return error('Password must be at least 6 characters')

  const hash = await hashPassword(password)

  try {
    const result = await env.DB.prepare(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'student')"
    )
      .bind(username.trim(), hash)
      .run()

    const student = await env.DB.prepare(
      'SELECT id, username, created_at FROM users WHERE id = ?'
    )
      .bind(result.meta.last_row_id)
      .first()

    return json(student, 201)
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return error('Username already exists', 409)
    throw e
  }
}
