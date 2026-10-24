import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const argDir = process.argv.indexOf('--dir')
const root = argDir >= 0 ? resolve(process.argv[argDir + 1] ?? '') : resolve(dirname(process.argv[1]), '..', 'fixtures')

const errors: string[] = []
const fail = (file: string, msg: string) => errors.push(`${file}: ${msg}`)

function listJson(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...listJson(p))
    else if (name.endsWith('.json')) out.push(p)
  }
  return out
}

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T/
const TIME_KEYS = new Set(['time', 'issuedAt'])
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function walk(file: string, v: unknown, path: string) {
  if (Array.isArray(v)) {
    v.forEach((x, i) => walk(file, x, `${path}[${i}]`))
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (TIME_KEYS.has(k) && typeof x !== 'string') fail(file, `${path}.${k} is not a string`)
      walk(file, x, `${path}.${k}`)
    }
  } else if (typeof v === 'string' && ISO_LIKE.test(v)) {
    if (!v.endsWith('Z')) fail(file, `${path} "${v}" does not end with Z`)
    if (Number.isNaN(Date.parse(v))) fail(file, `${path} "${v}" does not parse`)
  }
}

if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`FAIL: directory not found: ${root}`)
  process.exit(1)
}

const files = listJson(root)
if (files.length === 0) fail(root, 'no JSON files found')

for (const file of files) {
  const rel = file.slice(root.length + 1)
  let data: any
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    fail(rel, `invalid JSON (${(e as Error).message})`)
    continue
  }
  if (data?.demo !== true) fail(rel, 'top-level demo !== true')
  walk(rel, data, '$')

  const base = file.split('/').pop()
  if (base === 'fields.json') {
    if (!Array.isArray(data?.fields) || data.fields.length !== 8) fail(rel, 'fields length !== 8')
    for (const f of data?.fields ?? []) {
      if (!ID_RE.test(f?.id ?? '')) fail(rel, `field id "${f?.id}" is not lowercase-hyphen`)
      if (!ID_RE.test(f?.farmId ?? '')) fail(rel, `farmId "${f?.farmId}" is not lowercase-hyphen`)
    }
  } else if (base === 'observation.json') {
    if (!Array.isArray(data?.hourly) || data.hourly.length !== 72) fail(rel, 'observation hourly length !== 72')
  } else if (base === 'snapshot-source.json') {
    if (!Array.isArray(data?.runs) || data.runs.length === 0) fail(rel, 'runs missing')
    for (const r of data?.runs ?? []) {
      if (!Array.isArray(r?.hourly) || r.hourly.length !== 48) fail(rel, `run ${r?.model}@${r?.issuedAt} hourly length !== 48`)
    }
  }
}

if (errors.length > 0) {
  console.error(`FAIL: ${errors.length} problem(s)`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`OK: ${files.length} fixture files checked in ${root}`)
