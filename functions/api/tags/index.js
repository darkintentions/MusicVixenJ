import { json, error } from '../_utils.js'

export async function onRequestGet(context) {
  const { env } = context
  const { results } = await env.DB.prepare(
    'SELECT * FROM tags ORDER BY name'
  ).all()
  return json(results)
}

export async function onRequestPost(context) {
  const { request, env, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { name, color } = await request.json()
  if (!name?.trim()) return error('Tag name is required')

  try {
    const result = await env.DB.prepare(
      'INSERT INTO tags (name, color) VALUES (?, ?)'
    )
      .bind(name.trim(), color || '#6366f1')
      .run()

    const tag = await env.DB.prepare('SELECT * FROM tags WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first()

    return json(tag, 201)
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return error('Tag name already exists', 409)
    throw e
  }
}
