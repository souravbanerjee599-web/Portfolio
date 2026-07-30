import { gsap } from 'gsap'

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const SESSION_KEY = 'sb-hero-played'

export function initHero() {
  const revealLine = document.getElementById('hero-reveal-line')
  const lines = document.querySelectorAll('.hero-line')
  const topBar = document.querySelector('.top-bar')
  const heroSub = document.querySelector('.hero-sub')
  const heroArrow = document.getElementById('hero-arrow')

  // Arrow smooth scroll
  heroArrow?.addEventListener('click', () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  })

  const alreadyPlayed = sessionStorage.getItem(SESSION_KEY)

  if (REDUCED || alreadyPlayed) {
    // Skip straight to end state
    gsap.set([topBar, heroSub, heroArrow], { opacity: 1 })
    gsap.set(lines, { y: 0, opacity: 1 })
    gsap.set(revealLine, { scaleX: 0, display: 'none' })
    return
  }

  sessionStorage.setItem(SESSION_KEY, '1')

  // Initial state
  gsap.set(revealLine, { scaleX: 0, display: 'block', transformOrigin: 'left center' })
  gsap.set(lines, { y: '110%', opacity: 0 })
  gsap.set([topBar, heroSub, heroArrow], { opacity: 0 })

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

  // 1) Line draws in
  tl.to(revealLine, {
    scaleX: 1,
    duration: 0.7,
    ease: 'expo.out',
  })

  // 2) Lines rise in (the line becomes the top edge of the reveal)
  tl.to(revealLine, { scaleY: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }, '+=0.05')
  tl.to(lines, {
    y: 0,
    opacity: 1,
    stagger: 0.08,
    duration: 0.7,
    ease: 'expo.out',
  }, '<0.1')

  // 3) Supporting elements fade in
  tl.to(topBar, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
  tl.to(heroSub, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '<0.1')
  tl.to(heroArrow, { opacity: 1, duration: 0.4, ease: 'power2.out' }, '<0.15')
}
