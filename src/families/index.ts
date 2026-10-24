import type { Family, FamilyId } from '../core/types'
import { nowcasting } from './nowcasting/index'

// Other family owners: add exactly one line each below.
export const families: Partial<Record<FamilyId, Family>> = {
  nowcasting,
}
