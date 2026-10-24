// GET /api/farm/map -> 지도에 찍을 필지, 위험점수, 올해 예상 생산량 (목업)
import { farmData } from '../../../../farm/data'
import { predictYield, seasonOutlook, trainYieldModel } from '../../../../farm/yieldModel'

export async function GET() {
  const model = trainYieldModel(farmData.yields, farmData.seasons)
  return Response.json({
    demo: true,
    fields: farmData.fields.map((f) => {
      const clim = farmData.climatology.find((c) => c.fieldId === f.id)
      const soFar = farmData.current.find((c) => c.fieldId === f.id)
      const outlook = soFar && clim ? seasonOutlook(soFar.weather, clim) : { frostNights: 0, heavyRainDays: 0, dryWeeks: 0 }
      return {
        ...f,
        risk: Object.fromEntries(farmData.riskScores.filter((s) => s.fieldId === f.id).map((s) => [s.peril, s.score])),
        yieldPct: predictYield(model, f.id, outlook).pct,
      }
    }),
  })
}
