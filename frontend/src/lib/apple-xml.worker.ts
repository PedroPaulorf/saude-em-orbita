import { createAppleXmlReader } from './wearables'

self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const file = event.data, reader = createAppleXmlReader()
    // Bounded input buffers; never construct a 200 MB DOM tree or whole input string.
    const decoder = new TextDecoder('utf-8', { fatal: true })
    for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
      const chunk = await file.slice(offset, offset + 1024 * 1024).arrayBuffer()
      reader.write(decoder.decode(chunk, { stream: true }))
      self.postMessage({ progress: Math.min(100, Math.round((offset + chunk.byteLength) / file.size * 100)) })
    }
    reader.write(decoder.decode())
    self.postMessage({ data: reader.finish() })
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Could not read the Apple Health export.' }) }
}
