import { gsap } from 'gsap'

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initReveal() {
  const card = document.getElementById('portrait-card')
  const portraitA = document.getElementById('portrait-a')
  const hole = document.getElementById('reveal-hole')
  const maskRect = document.getElementById('reveal-mask-rect')
  const turbulence = document.querySelector('#goo-edge feTurbulence')

  if (!card || !portraitA || !hole) return

  // maskUnits="userSpaceOnUse" on a CSS-masked element uses element-local coords.
  // Set the white rect to a large fixed size so it always covers the image.
  if (maskRect) {
    maskRect.setAttribute('x', '-500')
    maskRect.setAttribute('y', '-500')
    maskRect.setAttribute('width', '5000')
    maskRect.setAttribute('height', '5000')
  }

  // Apply SVG mask to the top image
  portraitA.style.mask = 'url(#reveal-mask)'
  portraitA.style.webkitMask = 'url(#reveal-mask)'

  let holeX = 0, holeY = 0
  let targetX = 0, targetY = 0
  let isInside = false
  let bfX = 0.012, bfY = 0.016
  let bfDirX = 1, bfDirY = 1
  let animFrame = 0

  function toElementCoords(clientX, clientY) {
    const rect = portraitA.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  function animateEdge() {
    animFrame++
    if (animFrame % 3 === 0 && turbulence) {
      bfX += bfDirX * 0.00008
      bfY += bfDirY * 0.00015
      if (bfX > 0.018 || bfX < 0.008) bfDirX *= -1
      if (bfY > 0.022 || bfY < 0.010) bfDirY *= -1
      turbulence.setAttribute('baseFrequency', `${bfX.toFixed(5)} ${bfY.toFixed(5)}`)
    }

    if (isInside) {
      holeX += (targetX - holeX) * 0.15
      holeY += (targetY - holeY) * 0.15
      hole.setAttribute('cx', Math.round(holeX))
      hole.setAttribute('cy', Math.round(holeY))
    }

    requestAnimationFrame(animateEdge)
  }

  requestAnimationFrame(animateEdge)

  if (REDUCED) {
    card.addEventListener('click', () => {
      const aOpacity = parseFloat(window.getComputedStyle(portraitA).opacity)
      gsap.to(portraitA, { opacity: aOpacity > 0.5 ? 0 : 1, duration: 0.4 })
    })
    return
  }

  card.addEventListener('pointerenter', (e) => {
    isInside = true
    const pos = toElementCoords(e.clientX, e.clientY)
    holeX = pos.x
    holeY = pos.y
    targetX = pos.x
    targetY = pos.y
    hole.setAttribute('cx', Math.round(holeX))
    hole.setAttribute('cy', Math.round(holeY))
    gsap.to(hole, { attr: { r: 130 }, duration: 0.6, ease: 'elastic.out(1, 0.6)' })
  })

  card.addEventListener('pointermove', (e) => {
    if (!isInside) return
    const pos = toElementCoords(e.clientX, e.clientY)
    targetX = pos.x
    targetY = pos.y
  })

  card.addEventListener('pointerleave', () => {
    isInside = false
    gsap.to(hole, { attr: { r: 0 }, duration: 0.35, ease: 'power2.in' })
  })

  // Double-tap to toggle on touch (passive: false so we can call preventDefault)
  let lastTap = 0
  card.addEventListener('touchstart', (e) => {
    const now = Date.now()
    if (now - lastTap < 400) {
      e.preventDefault()
      const aOpacity = parseFloat(window.getComputedStyle(portraitA).opacity)
      gsap.to(portraitA, { opacity: aOpacity > 0.5 ? 0 : 1, duration: 0.4 })
    }
    lastTap = now
  }, { passive: false })
}
