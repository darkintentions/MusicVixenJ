import { json } from './_utils.js'

export async function onRequestGet(context) {
  const { env, data } = context

  const { results } = await env.DB.prepare(`
    SELECT m.*, a.id as assignment_id, a.notes as assignment_notes, a.assigned_at,
           GROUP_CONCAT(t.id || ':' || t.name || ':' || t.color) as tags_raw
    FROM assignments a
    JOIN music m ON m.id = a.music_id
    LEFT JOIN music_tags mt ON mt.music_id = m.id
    LEFT JOIN tags t ON t.id = mt.tag_id
    WHERE a.student_id = ?
    GROUP BY m.id
    ORDER BY a.assigned_at DESC
  `)
    .bind(data.user.sub)
    .all()

  const music = results.map(row => {
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
  })

  return json(music)
}
