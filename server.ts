import path from 'node:path'
import express, { type Request, type Response } from 'express'
import { Trie } from './dictionary/trie.js'

const PORT = Number(process.env.PORT) || 8399

const app = express()
app.use(express.json())

app.get('/health_check', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})

app.post('/echo', (req: Request, res: Response) => {
  const body = req.body as unknown
  if (typeof body !== 'object' || body === null || !('text' in body)) {
    res.status(400).json({
      error: 'Expected JSON body: { "text": "<string>" }',
    })
    return
  }
  const text = (body as { text: unknown }).text
  if (typeof text !== 'string') {
    res.status(400).json({
      error: 'Expected JSON body: { "text": "<string>" }',
    })
    return
  }
  res.status(200).json({ received: { text } })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

async function main(): Promise<void> {
  const dictionaryPath = path.join(import.meta.dirname, 'dictionary.txt')
  console.log('Loading dictionary into trie…')
  const started = Date.now()
  const dictionaryTrie = await Trie.fromDictionaryFile(dictionaryPath)
  app.locals.dictionaryTrie = dictionaryTrie
  console.log(
    `Dictionary ready: ${dictionaryTrie.wordCount.toLocaleString()} words in ${Date.now() - started}ms`,
  )

  app.listen(PORT, () => {
    console.log(`GET  http://localhost:${PORT}/health_check`)
    console.log(`POST http://localhost:${PORT}/echo  body: {"text":"hello world"}`)
  })
}

async function startServer(): Promise<void> {
  try {
    await main()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

void startServer()
