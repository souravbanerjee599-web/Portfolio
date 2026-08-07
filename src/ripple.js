export function initBackgroundRipples() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const layer = document.createElement('div')
  layer.className = 'cursor-ripple-layer'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)

  let lastX = -Infinity
  let lastY = -Infinity
  let lastTime = 0

  document.addEventListener('pointermove', event => {
    // Touch scrolling should remain calm; the ripples are a mouse-hover effect.
    if (event.pointerType === 'touch') return

    const now = performance.now()
    const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY)
    if (distance < 42 && now - lastTime < 110) return

    lastX = event.clientX
    lastY = event.clientY
    lastTime = now

    const ripple = document.createElement('span')
    ripple.className = 'cursor-ripple'
    ripple.style.left = `${event.clientX}px`
    ripple.style.top = `${event.clientY}px`
    ripple.style.setProperty('--ripple-size', `${170 + Math.round(Math.random() * 120)}px`)
    layer.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
  }, { passive: true })
}
