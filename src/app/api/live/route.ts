import { buildReplay, isReplayScenario } from '../../../families/nowcasting/replay'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** GET /api/live?scenario=forecast-miss&fieldId=field-ia-01&t0=2026-06-10T15:00:00Z -> Replay JSON (fixtures only, demo). */
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams
  const scenario = q.get('scenario') ?? 'forecast-miss'
  if (!isReplayScenario(scenario)) return json({ error: `unknown scenario: ${scenario}` }, 400)
  try {
    return json(buildReplay(scenario, q.get('fieldId') ?? undefined, q.get('t0') ?? undefined))
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
}
