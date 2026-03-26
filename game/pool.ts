import { INITIAL_POOL_COUNTS } from './constants.js'
import { indexToLetter, LETTER_COUNT, letterToIndex, type MutableTileMultiset } from './letters.js'

/** Fresh bag copy (26 counts, mutable). */
export function createInitialPool(): MutableTileMultiset {
  return [...INITIAL_POOL_COUNTS] as MutableTileMultiset
}

export function totalTilesInPool(pool: ReadonlyArray<number>): number {
  return pool.reduce((sum, n) => sum + n, 0)
}

/** Remove one tile of this letter from the pool. Mutates `pool`. */
export function takeLetterFromPool(pool: MutableTileMultiset, letter: string): boolean {
  const i = letterToIndex(letter)
  if (pool[i]! <= 0) return false
  pool[i] = pool[i]! - 1
  return true
}

/** Return one tile of this letter to the pool. Mutates `pool`. */
export function returnLetterToPool(pool: MutableTileMultiset, letter: string): void {
  const i = letterToIndex(letter)
  pool[i] = pool[i]! + 1
}

/**
 * Draw one random tile (uniform over remaining tiles). Mutates `pool`.
 * @returns lowercase letter `a`–`z`, or `null` if pool is empty
 */
export function drawRandomTileFromPool(pool: MutableTileMultiset): string | null {
  const total = totalTilesInPool(pool)
  if (total === 0) return null
  let r = Math.floor(Math.random() * total)
  for (let i = 0; i < LETTER_COUNT; i += 1) {
    const c = pool[i]!
    if (r < c) {
      pool[i] = c - 1
      return indexToLetter(i)
    }
    r -= c
  }
  return null
}
