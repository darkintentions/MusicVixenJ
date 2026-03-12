import { json, error } from '../_utils.js'

export async function onRequestGet(context) {
  const { env, data } = context
  const user = data.user

  let results
  if (user.role === 'teacher') {
    const res = await env.DB.prepare(`
      SELECT m.*, GROUP_CONCAT(t.id || ':' || t.name || ':' || t.color) as tags_raw
      FROM music m
      LEFT JOIN music_tags mt ON mt.music_id = m.id
      LEFT JOIN tags t ON t.id = mt.tag_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `).all()
    results = res.results.map(parseTags)
  } else {
    const res = await env.DB.prepare(`
      SELECT m.*, a.notes as assignment_notes, a.assigned_at,
             GROUP_CONCAT(t.id || ':' || t.name || ':' || t.color) as tags_raw
      FROM assignments a
      JOIN music m ON m.id = a.music_id
      LEFT JOIN music_tags mt ON mt.music_id = m.id
      LEFT JOIN tags t ON t.id = mt.tag_id
      WHERE a.student_id = ?
      GROUP BY m.id
      ORDER BY a.assigned_at DESC
    `)
      .bind(user.sub)
      .all()
    results = res.results.map(parseTags)
  }

  return json(results)
}

export async function onRequestPost(context) {
  const { request, env, data } = context

  if (data.user.role !== 'teacher') return error('Forbidden', 403)

  const formData = await request.formData()
  const file = formData.get('file')
  const title = formData.get('title') || file?.name?.replace(/\.pdf$/i, '') || 'Untitled'
  const extractedText = formData.get('extracted_text') || ''
  const tableData = formData.get('table_data') || null

  if (!file || file.type !== 'application/pdf') {
    return error('A PDF file is required')
  }

  const uuid = crypto.randomUUID()
  const r2Key = `music/${uuid}.pdf`

  await env.MUSIC_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: 'application/pdf' },
  })

  const result = await env.DB.prepare(`
    INSERT INTO music (title, filename, r2_key, extracted_text, table_data)
    VALUES (?, ?, ?, ?, ?)
  `)
    .bind(title, file.name, r2Key, extractedText.slice(0, 100000), tableData)
    .run()

  const music = await env.DB.prepare('SELECT * FROM music WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first()

  return json({ ...music, tags: [] }, 201)
}

function parseTags(row) {
  const tags = row.tags_raw
    ? row.tags_raw.split(',').map(t => {
        const parts = t.split(':')
        // color may contain # so rejoin from index 2
        const id = Number(parts[0])
        const name = parts[1]
        const color = parts.slice(2).join(':')
        return { id, name, color }
      })
    : []
  const { tags_raw, ...rest } = row
  return { ...rest, tags }
}
