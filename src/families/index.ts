import type { Family, FamilyId } from '../core/types'
import { nowcasting } from './nowcasting/index'
import { downscaling } from './downscaling/index'
import { decision } from './decision/index'

// Other family owners: add exactly one line each below.
export const families: Partial<Record<FamilyId, Family>> = {
  nowcasting,
  downscaling,
  decision,
}
