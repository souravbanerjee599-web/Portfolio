import { createNoise3D } from 'simplex-noise'

const noise3D = createNoise3D()

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initDust(canvas) {
  const ctx = canvas.getContext('2d')
  let W, H, particles = [], raf = null
  let t = 0
  let ripplePulses = []

  function resize() {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
    if (REDUCED) {
      buildParticles()
      drawFrame()
    }
  }

  function buildParticles() {
    const density = Math.min(W * H / 320, 4000)
    const count = Math.max(800, Math.floor(density))
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0,
      vy: 0,
      size: 0.5 + Math.random() * 1,
      opacity: 0.15 + Math.random() * 0.35,
      // slight lavender-white tint
      r: 210 + Math.floor(Math.random() * 30),
      g: 210 + Math.floor(Math.random() * 20),
      b: 230 + Math.floor(Math.random() * 25),
    }))
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H)

    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.opacity})`
      ctx.fill()
    }
  }

  function tick() {
    if (document.hidden) return  // don't re-queue; visibilitychange restarts us

    t += 0.00008

    // Smooth mouse — faster lerp = tighter tracking = more responsive feel

    for (const p of particles) {
      // Flow field
      const angle = noise3D(p.x * 0.0008, p.y * 0.0008, t) * Math.PI * 2
      const flowVx = Math.cos(angle) * 0.25
      const flowVy = Math.sin(angle) * 0.25

      p.vx += (flowVx - p.vx) * 0.03
      p.vy += (flowVy - p.vy) * 0.03

      // Each visual ripple sends a soft, expanding wave through the dust.
      // Only particles close to the wave-front receive a small outward push.
      for (const wave of ripplePulses) {
        const dx = p.x - wave.x
        const dy = p.y - wave.y
        const distance = Math.hypot(dx, dy) || 1
        const ringDistance = Math.abs(distance - wave.radius)
        if (ringDistance < 28) {
          const waveStrength = (1 - ringDistance / 28) * wave.life * 0.085
          p.vx += (dx / distance) * waveStrength
          p.vy += (dy / distance) * waveStrength
        }
      }

      // Cursor repulsion — wider radius, stronger push
      // Velocity damping
      p.vx *= 0.96
      p.vy *= 0.96

      // Cap velocity — raised slightly to allow cursor bursts through
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      if (spd > 0.65) {
        p.vx = (p.vx / spd) * 0.65
        p.vy = (p.vy / spd) * 0.65
      }

      p.x += p.vx
      p.y += p.vy

      // Wrap edges
      if (p.x < -2) p.x = W + 2
      else if (p.x > W + 2) p.x = -2
      if (p.y < -2) p.y = H + 2
      else if (p.y > H + 2) p.y = -2
    }

    ripplePulses.forEach(wave => {
      wave.radius += 5.2
      wave.life -= 0.016
    })
    ripplePulses = ripplePulses.filter(wave => wave.life > 0 && wave.radius < 360)

    drawFrame()
    raf = requestAnimationFrame(tick)
  }

  // Mouse tracking
  // Pause when hidden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !REDUCED) {
      raf = requestAnimationFrame(tick)
    }
  })

  document.addEventListener('background-ripple', event => {
    const { x, y } = event.detail || {}
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    ripplePulses.push({ x, y, radius: 0, life: 1 })
    // Keep the background work lightweight when the mouse moves quickly.
    if (ripplePulses.length > 5) ripplePulses.shift()
  })

  window.addEventListener('resize', resize, { passive: true })

  resize()
  buildParticles()

  if (REDUCED) {
    drawFrame()
  } else {
    raf = requestAnimationFrame(tick)
  }
}
