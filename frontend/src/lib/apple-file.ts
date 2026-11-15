import type { ParsedWearables } from './wearables'

export function readAppleFile(file: File, signal: AbortSignal, progress: (percent: number) => void): Promise<ParsedWearables> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./apple-xml.worker.ts', import.meta.url), { type: 'module' })
    const clean = () => { signal.removeEventListener('abort', abort); worker.terminate() }
    const abort = () => { clean(); reject(new DOMException('Reading cancelled', 'AbortError')) }
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    worker.onerror = () => { clean(); reject(new Error('Could not read the export. Try a smaller file or another browser.')) }
    worker.onmessage = (event: MessageEvent<{ progress?: number; data?: ParsedWearables; error?: string }>) => {
      if (event.data.progress !== undefined) progress(event.data.progress)
      if (event.data.error) { clean(); reject(new Error(event.data.error)) }
      if (event.data.data) { clean(); resolve(event.data.data) }
    }
    worker.postMessage(file)
  })
}
