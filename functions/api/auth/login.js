import { SignJWT } from 'jose'
import { verifyPassword, json, error } from '../_utils.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const body = await request.json()
  const { username, password } = body

  if (!username || !password) {
    return error('Username and password required')
  }

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE username = ?'
  )
    .bind(username)
    .first()

  if (!user) return error('Invalid credentials', 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return error('Invalid credentials', 401)

  const secret = new TextEncoder().encode(env.JWT_SECRET || 'music-db-secret-change-me')
  const token = await new SignJWT({
    sub: String(user.id),
    role: user.role,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  return json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  })
}
