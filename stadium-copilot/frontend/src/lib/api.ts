const BASE = import.meta.env.DEV ? '' : ''

export async function chatRequest(payload: {
  venue_id: string
  session_id: string
  message?: string
  image_base64?: string
  accessibility_mode: boolean
  user_context: { section?: string; seat?: string }
}) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Chat failed')
  return res.json()
}

export async function getVenue(venueId: string) {
  const res = await fetch(`${BASE}/api/venues/${venueId}`)
  if (!res.ok) throw new Error('Venue not found')
  return res.json()
}

export async function triggerScenario(venueId: string, scenarioId: string, speed = 1) {
  const res = await fetch(`${BASE}/api/director/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue_id: venueId, scenario_id: scenarioId, speed }),
  })
  return res.json()
}

export async function approveRec(venueId: string, recId: string) {
  const res = await fetch(`${BASE}/api/ops/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue_id: venueId, rec_id: recId }),
  })
  return res.json()
}

export async function sendAnnouncement(venueId: string, text: string) {
  const res = await fetch(`${BASE}/api/ops/announce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue_id: venueId, text }),
  })
  return res.json()
}

export async function addIncident(venueId: string, zoneId: string, text: string) {
  const res = await fetch(`${BASE}/api/ops/incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue_id: venueId, zone_id: zoneId, text }),
  })
  return res.json()
}

export async function getOpsState(venueId: string) {
  const res = await fetch(`${BASE}/api/ops/state/${venueId}`)
  if (!res.ok) return null
  return res.json()
}

export async function getHealth() {
  try {
    const res = await fetch(`${BASE}/api/health`)
    return res.json()
  } catch {
    return { status: 'error', gemini: 'degraded' }
  }
}
