/** Bananagrams tile counts per letter (indices 0 = `a` … 25 = `z`). Total = 144. */
export const INITIAL_POOL_COUNTS = [
  13, 3, 3, 6, 18, 3, 4, 3, 12, 2, 2, 5, 3, 8, 11, 3, 2, 9, 6, 9, 6, 3, 3, 2, 3, 2,
] as const satisfies readonly number[] & { length: 26 }

export type InitialPoolCounts = typeof INITIAL_POOL_COUNTS

/** Starting hand size by number of players (official-style table). */
export const STARTING_HAND_SIZE_BY_PLAYER_COUNT: Readonly<Record<number, number>> = Object.freeze({
    1: 21,
    2: 21,
    3: 21,
    4: 21,
    5: 15,
    6: 11,
    7: 9,
    8: 7,
})

