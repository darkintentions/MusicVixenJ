import { json, error } from '../../_utils.js'

// POST /api/music/:id/tags — replace all tags on a music piece
export async function onRequestPost(context) {
  const { request, env, params, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const { tagIds } = await request.json()

  await env.DB.prepare('DELETE FROM music_tags WHERE music_id = ?')
    .bind(params.id)
    .run()

  if (Array.isArray(tagIds) && tagIds.length > 0) {
    const placeholders = tagIds.map(() => '(?, ?)').join(', ')
    const values = tagIds.flatMap(tid => [params.id, tid])
    await env.DB.prepare(`INSERT INTO music_tags (music_id, tag_id) VALUES ${placeholders}`)
      .bind(...values)
      .run()
  }

  return json({ ok: true })
}
