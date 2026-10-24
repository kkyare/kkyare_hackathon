export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
export const usd2 = (n: number) => `$${n.toFixed(2)}`
export const pct = (p: number) => `${Math.round(p * 100)}%`

export async function getJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}
