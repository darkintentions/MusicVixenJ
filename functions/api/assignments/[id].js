import { json, error } from '../_utils.js'

export async function onRequestDelete(context) {
  const { env, params, data } = context
  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  await env.DB.prepare('DELETE FROM assignments WHERE id = ?').bind(params.id).run()
  return json({ ok: true })
}
