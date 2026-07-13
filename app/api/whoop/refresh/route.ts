import { NextRequest } from 'next/server'

import { bearerTokenMatches } from '@/lib/ios-apps'

export const dynamic = 'force-dynamic'

const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

// Opt-in guard: set WHOOP_PROXY_TOKEN and the Cbum app must send the matching
// bearer. Unset = open (single-user personal app; a caller still needs a valid
// WHOOP refresh token, and the client secret never leaves this server).
const PROXY_TOKEN = (process.env.WHOOP_PROXY_TOKEN || '').trim()

export async function POST(req: NextRequest) {
  if (PROXY_TOKEN && !bearerTokenMatches(req.headers.get('authorization'), PROXY_TOKEN)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { refreshToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.refreshToken) {
    return Response.json({ error: 'missing refreshToken' }, { status: 400 })
  }

  // WHOOP rotates the refresh token on every use — the app must store the new one.
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: body.refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
    scope: 'offline',
  })
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const json = await r.json().catch(() => ({}))
  if (!r.ok || !json.access_token) {
    return Response.json({ error: 'whoop refresh failed' }, { status: 502 })
  }
  return Response.json({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_in: json.expires_in,
  })
}
