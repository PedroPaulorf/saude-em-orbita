/*
  Base de animação da landing page: GSAP + ScrollTrigger (animações amarradas ao scroll) e Lenis
  (scroll suave). Tudo aqui só carrega com a landing, que é importada sob demanda em App.tsx.

  Regras:
  - Só transform e opacity (e clip-path/stroke em casos pontuais). Nada de animar layout.
  - Com "movimento reduzido" ligado no sistema, nenhuma cena é montada: a página fica estática e
    completa, porque o estado inicial das animações é aplicado pelo GSAP, não pelo CSS.
  - Seções presas (pin) só em tela larga e alta; no celular as mesmas peças entram sem prender.
*/
import { useEffect, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, useGSAP }

export const MOTION = '(prefers-reduced-motion: no-preference)'

export const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
export const finePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches

export interface Scene {
  /** Busca dentro da seção. */
  q: (selector: string) => HTMLElement[]
  root: HTMLElement
  /** Tela larga e alta o bastante para prender a seção enquanto a cena roda. */
  pinned: boolean
  wide: boolean
}

/**
 * Monta a cena de uma seção. Roda só com movimento permitido, refaz quando o idioma muda (o texto
 * e a altura mudam) e quando a tela cruza os limites de largura/altura. A limpeza é automática.
 */
export function useScene(scope: RefObject<HTMLElement | null>, lang: string, build: (scene: Scene) => void | (() => void)) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const mm = gsap.matchMedia()
      mm.add({ motion: MOTION, wide: '(min-width: 1024px)', tall: '(min-height: 700px)' }, (ctx) => {
        const c = ctx.conditions ?? {}
        if (!c.motion) return
        return build({ q: gsap.utils.selector(root), root, pinned: !!(c.wide && c.tall), wide: !!c.wide })
      })
      return () => mm.revert()
    },
    { dependencies: [lang], revertOnUpdate: true },
  )
}

/** Liga data-pinned na seção enquanto a cena presa existe; o layout de palco vem de classes group-data-[pinned]. */
export function markPinned(root: HTMLElement) {
  root.dataset.pinned = ''
  return () => {
    delete root.dataset.pinned
  }
}

/** Desenha um traço SVG (paths com pathLength=1), como se fosse feito à mão na hora. */
export function draw(paths: ArrayLike<Element>, vars: gsap.TweenVars = {}) {
  return gsap.fromTo(
    paths,
    { strokeDasharray: 1, strokeDashoffset: 1, autoAlpha: 0 },
    { strokeDashoffset: 0, autoAlpha: 1, duration: 0.45, stagger: 0.3, ease: 'power2.out', ...vars },
  )
}

/** Conta um número dentro de um elemento. Devolve o tween; use `restore` na limpeza para voltar o texto. */
export function count(el: Element, from: number, to: number, vars: gsap.TweenVars = {}) {
  const state = { v: from }
  return gsap.fromTo(
    state,
    { v: from },
    {
      v: to,
      ease: 'none',
      ...vars,
      onUpdate: () => {
        el.textContent = String(Math.round(state.v))
      },
    },
  )
}

// ---------- scroll suave ----------

let lenis: Lenis | null = null

/** Scroll suave só enquanto a landing está montada. Desligado com movimento reduzido. */
export function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return
    const l = new Lenis()
    lenis = l
    l.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => l.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      l.destroy()
      lenis = null
    }
  }, [])
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  // As seções têm scroll-margin-top da altura do cabeçalho; o Lenis e o navegador já descontam.
  if (lenis) lenis.scrollTo(el)
  else el.scrollIntoView({ behavior: 'auto' })
}

/** Logo do cabeçalho: volta ao começo da página. */
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0)
  else window.scrollTo(0, 0)
}

/** Sobe até o topo de um elemento só se ele já passou para cima da tela (troca de passo na simulação). */
export function revealTop(el: Element) {
  const top = el.getBoundingClientRect().top
  if (top >= 72) return
  if (lenis) lenis.scrollTo(window.scrollY + top - 80)
  else window.scrollTo(0, window.scrollY + top - 80)
}

/** Volta para uma posição sem animar (usado ao trocar de idioma, que refaz as cenas). */
export function jumpTo(y: number) {
  // Pelo ScrollTrigger, para ele não devolver a posição antiga no próximo refresh.
  ScrollTrigger.getScrollFunc(window)(y)
  lenis?.scrollTo(y, { immediate: true, force: true })
}

// ---------- pequenos ganchos ----------

/** Piscar de olhos do companheiro. */
export function useBlink(every = 3700) {
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (reducedMotion()) return
    let open: ReturnType<typeof setTimeout> | undefined
    const eyes = setInterval(() => {
      setBlink(true)
      open = setTimeout(() => setBlink(false), 160)
    }, every)
    return () => {
      clearInterval(eyes)
      if (open) clearTimeout(open)
    }
  }, [every])
  return blink
}
