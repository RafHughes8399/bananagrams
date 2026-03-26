import { STARTING_HAND_SIZE_BY_PLAYER_COUNT } from './constants.js'
import { createInitialPool, drawRandomTileFromPool, totalTilesInPool } from './pool.js'
import { createEmptyHand, totalTilesInHand } from './hand.js'
import { letterToIndex, type MutableTileMultiset } from './letters.js'

export interface PlacedWord {
  readonly id: string
  /** Stored lowercase `a`–`z` to match trie / dictionary. */
  word: string
}

export class GameState {
  /** Tiles remaining in the bag (26 buckets). */
  pool: MutableTileMultiset
  /** Tiles in hand (26 buckets); multiplayer can become `hand[]` later. */
  hand: MutableTileMultiset
  placedWords: PlacedWord[]
  private nextWordId = 1

  constructor() {
    this.pool = createInitialPool()
    this.hand = createEmptyHand()
    this.placedWords = []
  }

  /** Initial split / deal: draw from pool until hand reaches starting size. */
  split(playerCount = 1): void {
    const key = Math.min(Math.max(playerCount, 1), 8)
    const n = STARTING_HAND_SIZE_BY_PLAYER_COUNT[key] ?? 7
    while (totalTilesInHand(this.hand) < n && totalTilesInPool(this.pool) > 0) {
      const letter = drawRandomTileFromPool(this.pool)
      if (letter) {
        const i = letterToIndex(letter)
        this.hand[i] = this.hand[i]! + 1
      }
    }
  }

  /**
   * Place a word on the grid (spatial + dictionary validation later).
   * By default consumes matching letters from the hand.
   */
  placeWord(word: string, { consumeFromHand = true }: { consumeFromHand?: boolean } = {}): string {
    const lower = word.toLowerCase()
    if (consumeFromHand) {
      const need = countLetters(lower)
      for (const [idx, count] of Object.entries(need)) {
        const i = Number(idx)
        if (this.hand[i]! < count) {
          throw new Error(`Hand missing letters for "${word}"`)
        }
      }
      for (const [idx, count] of Object.entries(need)) {
        const i = Number(idx)
        this.hand[i] = this.hand[i]! - count
      }
    }
    const id = `w${this.nextWordId++}`
    this.placedWords.push({ word: lower, id })
    return id
  }

  destroyWord(wordId: string): boolean {
    const i = this.placedWords.findIndex((p) => p.id === wordId)
    if (i === -1) return false
    this.placedWords.splice(i, 1)
    return true
  }

  checkWin(): boolean {
    return (
      totalTilesInHand(this.hand) === 0 &&
      totalTilesInPool(this.pool) === 0 &&
      this.placedWords.length > 0
    )
  }
}

/** Letter bucket counts from a lowercase a–z string. */
function countLetters(word: string): Record<number, number> {
  const m: Record<number, number> = {}
  for (const ch of word) {
    if (ch < 'a' || ch > 'z') continue
    const i = letterToIndex(ch)
    m[i] = (m[i] ?? 0) + 1
  }
  return m
}
