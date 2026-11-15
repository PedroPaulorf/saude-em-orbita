import type { ParsedWearables } from './wearables'

/** Stable cursor IDs preserve ambiguous retries; overlapping files deduplicate on the server. */
export function nextImportBatch(data: ParsedWearables, clientId: string, offset: number) {
  const samples = []; let bytes = 1024
  const encoder = new TextEncoder()
  for (let i = offset; i < data.samples.length && samples.length < 500; i++) {
    const size = encoder.encode(JSON.stringify(data.samples[i])).length + 1
    if (bytes + size > 220 * 1024) break
    samples.push(data.samples[i]); bytes += size
  }
  if (!samples.length) throw new Error('No measurements available for this batch.')
  return { clientId: `${clientId}-${offset}`, version: data.version, source: data.source, format: data.format, quality: data.quality, samples }
}

export function pauseImport(signal: AbortSignal, ms = 650): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Import stopped', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}
