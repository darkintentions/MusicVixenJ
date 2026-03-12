import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/api/auth/login', '/api/setup']

export async function onRequest(context) {
  const { request, env, next } = context
  const url = new URL(request.url)

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
    })
  }

  // Allow public paths without JWT
  if (PUBLIC_PATHS.includes(url.pathname)) {
    const res = await next()
    return withCors(res)
  }

  // Require JWT for all other /api/* routes
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const token = auth.slice(7)
  const secret = new TextEncoder().encode(env.JWT_SECRET || 'music-db-secret-change-me')

  try {
    const { payload } = await jwtVerify(token, secret)
    context.data.user = payload
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const res = await next()
  return withCors(res)
}

function withCors(res) {
  const newRes = new Response(res.body, res)
  newRes.headers.set('Access-Control-Allow-Origin', '*')
  return newRes
}
