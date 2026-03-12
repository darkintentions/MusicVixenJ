import { json, error } from '../../_utils.js'

export async function onRequestGet(context) {
  const { env, params, data } = context

  const music = await env.DB.prepare(`
    SELECT m.*, GROUP_CONCAT(t.id || ':' || t.name || ':' || t.color) as tags_raw
    FROM music m
    LEFT JOIN music_tags mt ON mt.music_id = m.id
    LEFT JOIN tags t ON t.id = mt.tag_id
    WHERE m.id = ?
    GROUP BY m.id
  `)
    .bind(params.id)
    .first()

  if (!music) return error('Not found', 404)

  // Students can only access music assigned to them
  if (data.user.role === 'student') {
    const assignment = await env.DB.prepare(
      'SELECT id FROM assignments WHERE music_id = ? AND student_id = ?'
    )
      .bind(params.id, data.user.sub)
      .first()
    if (!assignment) return error('Forbidden', 403)
  }

  return json(parseTags(music))
}

export async function onRequestPatch(context) {
  const { request, env, params, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { title, notes, table_data, keys_data } = await request.json()
  if (!title?.trim()) return error('Title is required')

  await env.DB.prepare('UPDATE music SET title = ?, notes = ?, table_data = ?, keys_data = ? WHERE id = ?')
    .bind(title.trim(), notes || null, table_data ?? null, keys_data ?? null, params.id)
    .run()

  const music = await env.DB.prepare(`
    SELECT m.*, GROUP_CONCAT(t.id || ':' || t.name || ':' || t.color) as tags_raw
    FROM music m
    LEFT JOIN music_tags mt ON mt.music_id = m.id
    LEFT JOIN tags t ON t.id = mt.tag_id
    WHERE m.id = ?
    GROUP BY m.id
  `)
    .bind(params.id)
    .first()

  return json(parseTags(music))
}

export async function onRequestDelete(context) {
  const { env, params, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const music = await env.DB.prepare('SELECT r2_key FROM music WHERE id = ?')
    .bind(params.id)
    .first()
  if (!music) return error('Not found', 404)

  // Delete R2 file first
  await env.MUSIC_BUCKET.delete(music.r2_key)

  // Delete all related DB rows in one atomic batch
  // (D1/SQLite does not enforce ON DELETE CASCADE by default)
  await env.DB.batch([
    env.DB.prepare('DELETE FROM assignments WHERE music_id = ?').bind(params.id),
    env.DB.prepare('DELETE FROM music_tags WHERE music_id = ?').bind(params.id),
    env.DB.prepare('DELETE FROM music WHERE id = ?').bind(params.id),
  ])

  return json({ ok: true })
}

function parseTags(row) {
  const tags = row.tags_raw
    ? row.tags_raw.split(',').map(t => {
        const parts = t.split(':')
        const id = Number(parts[0])
        const name = parts[1]
        const color = parts.slice(2).join(':')
        return { id, name, color }
      })
    : []
  const { tags_raw, ...rest } = row
  return { ...rest, tags }
}
