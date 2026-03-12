import { error } from '../../_utils.js'

export async function onRequestGet(context) {
  const { env, params, data } = context

  // Students can only access music assigned to them
  if (data.user.role === 'student') {
    const assignment = await env.DB.prepare(
      'SELECT id FROM assignments WHERE music_id = ? AND student_id = ?'
    )
      .bind(params.id, data.user.sub)
      .first()
    if (!assignment) return error('Forbidden', 403)
  }

  const music = await env.DB.prepare('SELECT r2_key, filename FROM music WHERE id = ?')
    .bind(params.id)
    .first()
  if (!music) return error('Not found', 404)

  const obj = await env.MUSIC_BUCKET.get(music.r2_key)
  if (!obj) return error('File not found in storage', 404)

  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${music.filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
