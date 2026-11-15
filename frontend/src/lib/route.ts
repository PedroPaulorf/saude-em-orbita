/*
  Rota por hash, sem biblioteca: funciona no GitHub Pages com base './' e com o botão voltar.
  #/  ·  #/prevention  ·  #/progress  ·  #/stats?region=head  ·  #/check/health  ·  #/check/behavioral  ·  #/profile  ·  #/welcome (landing)  ·  #/login  ·  #/mission (escolha da missão)
*/
import { useSyncExternalStore } from 'react'

export type Path = '/' | '/prevention' | '/progress' | '/stats' | '/check/health' | '/check/behavioral' | '/data' | '/integrations' | '/profile' | '/welcome' | '/login' | '/mission'
const PATHS: Path[] = ['/', '/prevention', '/progress', '/stats', '/check/health', '/check/behavioral', '/data', '/integrations', '/profile', '/welcome', '/login', '/mission']

export interface Route {
  path: Path
  params: URLSearchParams
}

function read(): string {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function parse(hash: string): Route {
  const [rawPath, query = ''] = hash.split('?')
  const path = (PATHS as string[]).includes(rawPath) ? (rawPath as Path) : '/'
  return { path, params: new URLSearchParams(query) }
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Rota atual; re-renderiza quando o hash muda. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, read, () => '/')
  return parse(hash)
}

/** Monta o href de uma rota, para usar em <a>. */
export function href(path: Path, params?: Record<string, string>) {
  const q = params ? new URLSearchParams(params).toString() : ''
  return `#${path}${q ? `?${q}` : ''}`
}

/** Navega para uma rota. Com replace, troca a entrada atual do histórico (ex.: escolher outra região). */
export function navigate(path: Path, params?: Record<string, string>, { replace = false } = {}) {
  if (replace) window.location.replace(href(path, params))
  else window.location.hash = href(path, params)
}
