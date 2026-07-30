import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initDust } from './dust.js'
import { initHero } from './hero.js'
import { initReveal } from './reveal.js'
import { initMarquee } from './marquee.js'
import { initLightbox } from './lightbox.js'
import { initPhysics } from './physics.js'

gsap.registerPlugin(ScrollTrigger)

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- Dust cloud background ----
initDust(document.getElementById('dust-canvas'))

// ---- Hero animation ----
initHero()

// ---- Scroll reveal for sections ----
if (!REDUCED) {
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => el.classList.add('in-view'),
    })
  })
} else {
  document.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('in-view'))
}

// ---- About: organic photo reveal ----
initReveal()

// ---- Marquee ----
initMarquee()

// ---- Project lightbox ----
initLightbox()

// ---- Capabilities physics ----
initPhysics()

// ---- Connect section: button pulse on hover ----
const connectBtn = document.querySelector('.connect-btn')
if (connectBtn && !REDUCED) {
  connectBtn.addEventListener('mouseenter', () => {
    gsap.to(connectBtn, { scale: 1.04, duration: 0.3, ease: 'expo.out' })
  })
  connectBtn.addEventListener('mouseleave', () => {
    gsap.to(connectBtn, { scale: 1, duration: 0.3, ease: 'expo.out' })
  })
}
