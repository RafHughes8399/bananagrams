import { createReadStream } from 'node:fs'
import * as readline from 'node:readline'

export class TrieNode {
  readonly children = new Map<string, TrieNode>()
  isEndOfWord = false
}

export class Trie {
  readonly root = new TrieNode()
  wordCount = 0

  /** @param word lowercase `a`–`z` (caller normalises). */
  insert(word: string): void {
    let node = this.root
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode())
      }
      node = node.children.get(ch)!
    }
    if (!node.isEndOfWord) {
      node.isEndOfWord = true
      this.wordCount += 1
    }
  }

  hasWord(word: string): boolean {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) return false
      node = node.children.get(ch)!
    }
    return node.isEndOfWord
  }

  static async fromDictionaryFile(filePath: string): Promise<Trie> {
    const trie = new Trie()
    const stream = createReadStream(filePath, { encoding: 'utf8' })
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

    for await (const line of rl) {
      const w = line.trim().toLowerCase()
      if (w.length === 0) continue
      trie.insert(w)
    }

    return trie
  }
}
