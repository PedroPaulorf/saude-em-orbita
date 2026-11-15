/** Service failures never interrupt the independent health-record workflow. */
export function aiFailureMessage(error: unknown): string {
  const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
  return `${timedOut ? 'The AI took too long to respond.' : 'The AI is temporarily unavailable.'} Your check-ups remain available. Try again when the connection returns.`
}
