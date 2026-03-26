export { INITIAL_POOL_COUNTS, STARTING_HAND_SIZE_BY_PLAYER_COUNT } from './constants.js'
export type { InitialPoolCounts } from './constants.js'
export { indexToLetter, letterToIndex, LETTER_COUNT, ASCII_LOWERCASE_A } from './letters.js'
export type { LetterIndex, TileMultiset, MutableTileMultiset } from './letters.js'
export {
  createInitialPool,
  totalTilesInPool,
  takeLetterFromPool,
  returnLetterToPool,
  drawRandomTileFromPool,
} from './pool.js'
export { createEmptyHand, totalTilesInHand } from './hand.js'
export { GameState } from './gameState.js'
export type { PlacedWord } from './gameState.js'
