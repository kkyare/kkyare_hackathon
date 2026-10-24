// 실제 Claude로 Arena를 돌려 fixtures/arena/runs.json에 저장한다 (데모에서 ?mock=1·키 없음·실패 시 재생용).
//   node --env-file=.env.local --import tsx scripts/record-arena.ts --families nowcasting,decision --count 2
//   옵션: --families (기본 4개 전부) --count 패밀리당 과제 수 (기본 2) --models (기본 Haiku·Sonnet·Opus) --dry (저장 안 함)
// 같은 과제 × 모델 기록은 덮어쓰고 나머지는 유지한다.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ARENA_MODELS } from '../src/core/agent'
import type { FamilyId } from '../src/core/types'
import { families } from '../src/families/index'
import { demoTasks, loadSavedRuns, taskData } from '../src/arena/data'
import { runArena, type ArenaRun } from '../src/arena/run'
import { scoreboard } from '../src/arena/scoreboard'

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const list = (v: string | undefined) => v?.split(',').map(s => s.trim()).filter(Boolean)

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY가 없다. node --env-file=.env.local 로 실행')
  process.exit(1)
}

const familyIds = (list(arg('families')) ?? ['nowcasting', 'downscaling', 'decision', 's2s']) as FamilyId[]
const count = Number(arg('count') ?? 2)
const models = list(arg('models')) ?? ARENA_MODELS
const dry = process.argv.includes('--dry')
const out = path.join(process.cwd(), 'fixtures', 'arena', 'runs.json')

const tasks = familyIds.flatMap(f => demoTasks(f, count))
console.log(`과제 ${tasks.length}개 × 모델 ${models.length}개 = ${tasks.length * models.length}회 실행`)

async function main() {
  const started = Date.now()
  const result = await runArena({
    tasks, models, families, ...taskData(tasks),
    onEvent: e => {
      if (e.type === 'answer') console.log(`  ✓ ${e.run.taskId} × ${e.run.model} p=${e.run.answer.probability ?? '-'} ${e.run.answer.decision ?? ''} (${e.run.usage?.turns ?? '?'}턴)`)
      if (e.type === 'error') console.log(`  ✗ ${e.error.taskId} × ${e.error.model}: ${e.error.message}`)
    },
  })

  const usage = new Map<string, { input: number; output: number; n: number }>()
  for (const r of result.runs) {
    const u = usage.get(r.model) ?? { input: 0, output: 0, n: 0 }
    usage.set(r.model, { input: u.input + (r.usage?.inputTokens ?? 0), output: u.output + (r.usage?.outputTokens ?? 0), n: u.n + 1 })
  }
  console.log(`\n${((Date.now() - started) / 1000).toFixed(0)}초, 오류 ${result.errors.length}개`)
  console.table([...usage].map(([model, u]) => ({ model, runs: u.n, inputTokens: u.input, outputTokens: u.output })))
  console.table(scoreboard(result.scores).map(c => ({ model: c.model, family: c.family, n: c.n, brier: c.brier?.toFixed(3), crps: c.crps?.toFixed(2), regretUsd: c.regretUsd?.toFixed(1), skill: c.skill.toFixed(2), accuracy: c.accuracy?.toFixed(2), leaks: c.leaks })))

  if (dry) return
  const key = (r: ArenaRun) => `${r.taskId}|${r.model}`
  const merged = new Map(loadSavedRuns().map(r => [key(r), r]))
  for (const r of result.runs) merged.set(key(r), r)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify({ demo: true, recordedAt: new Date().toISOString(), runs: [...merged.values()] }, null, 2) + '\n')
  console.log(`\n저장: ${path.relative(process.cwd(), out)} (기록 ${merged.size}개)`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
