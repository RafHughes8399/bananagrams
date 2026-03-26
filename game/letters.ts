/** Number of letter slots (a–z). */
export const LETTER_COUNT = 26

/** ASCII `'a'` — index `0` → `'a'`, …, `25` → `'z'`. */
export const ASCII_LOWERCASE_A = 97

export type LetterIndex = number

/** Multiset of tiles: `counts[i]` = how many of `indexToLetter(i)`. Length must be 26. */
export type TileMultiset = readonly number[]

export type MutableTileMultiset = number[]

export function indexToLetter(index: LetterIndex): string {
  if (index < 0 || index >= LETTER_COUNT) {
    throw new RangeError(`letter index must be 0–${LETTER_COUNT - 1}, got ${index}`)
  }
  return String.fromCharCode(ASCII_LOWERCASE_A + index)
}

/** Single character `a`–`z` (case-normalised to lowercase). */
export function letterToIndex(letter: string): LetterIndex {
  if (typeof letter !== 'string' || letter.length !== 1) {
    throw new TypeError('letter must be a single character string')
  }
  const code = letter.toLowerCase().charCodeAt(0)
  if (code < ASCII_LOWERCASE_A || code > ASCII_LOWERCASE_A + 25) {
    throw new RangeError(`not a–z: ${letter}`)
  }
  return code - ASCII_LOWERCASE_A
}
