import { NextRequest } from 'next/server'

import { bearerTokenMatches } from '@/lib/ios-apps'

export const dynamic = 'force-dynamic'

const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

// Opt-in guard: set WHOOP_PROXY_TOKEN and the Cbum app must send the matching
// bearer. Unset = open (single-user personal app; the exchange still requires
// a valid one-time WHOOP auth code, and the secret never leaves this server).
const PROXY_TOKEN = (process.env.WHOOP_PROXY_TOKEN || '').trim()

export async function POST(req: NextRequest) {
  if (PROXY_TOKEN && !bearerTokenMatches(req.headers.get('authorization'), PROXY_TOKEN)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { code?: string; redirectUri?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.code || !body.redirectUri) {
    return Response.json({ error: 'missing code or redirectUri' }, { status: 400 })
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: body.code,
    redirect_uri: body.redirectUri,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
  })
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const json = await r.json().catch(() => ({}))
  if (!r.ok || !json.access_token) {
    // Surface WHOOP's real reason (invalid_client = stale/wrong secret,
    // redirect_uri_mismatch = dashboard, invalid_grant = expired code) so the
    // app can show it instead of a generic failure.
    const reason = json.error_description || json.error || 'whoop exchange failed'
    const hasSecret = Boolean(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET)
    return Response.json({ error: reason, whoopStatus: r.status, configured: hasSecret }, { status: 502 })
  }
  return Response.json({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_in: json.expires_in,
  })
}
