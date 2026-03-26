import type { Trie } from '../dictionary/trie.js'

declare global {
  namespace Express {
    interface Locals {
      dictionaryTrie: Trie
    }
  }
}

export {}
