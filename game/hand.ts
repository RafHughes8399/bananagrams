import { LETTER_COUNT, type MutableTileMultiset } from './letters.js'

/** Empty hand: 26 buckets, all zero. */
export function createEmptyHand(): MutableTileMultiset {
  return new Array<number>(LETTER_COUNT).fill(0) as MutableTileMultiset
}

export function totalTilesInHand(hand: ReadonlyArray<number>): number {
  return hand.reduce((sum, n) => sum + n, 0)
}
