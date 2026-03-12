import { json, error } from '../_utils.js'

export async function onRequestGet(context) {
  const { env, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { results } = await env.DB.prepare(`
    SELECT a.*, m.title as music_title, u.username as student_name
    FROM assignments a
    JOIN music m ON m.id = a.music_id
    JOIN users u ON u.id = a.student_id
    ORDER BY a.assigned_at DESC
  `).all()

  return json(results)
}

export async function onRequestPost(context) {
  const { request, env, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { music_id, student_id, notes } = await request.json()
  if (!music_id || !student_id) return error('music_id and student_id are required')

  try {
    const result = await env.DB.prepare(
      'INSERT INTO assignments (music_id, student_id, notes) VALUES (?, ?, ?)'
    )
      .bind(music_id, student_id, notes || null)
      .run()

    const assignment = await env.DB.prepare(`
      SELECT a.*, m.title as music_title, u.username as student_name
      FROM assignments a
      JOIN music m ON m.id = a.music_id
      JOIN users u ON u.id = a.student_id
      WHERE a.id = ?
    `)
      .bind(result.meta.last_row_id)
      .first()

    return json(assignment, 201)
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return error('Already assigned', 409)
    throw e
  }
}
