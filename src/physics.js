import Matter from 'matter-js'

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const LABELS = [
  'UI/UX DESIGN',
  'MOTION\nMICRO-UX',
  'WEB3\nCRYPTO UI',
  'DASHBOARD\nDESIGN',
  'BRANDING',
  'LANDING\nPAGES',
  'USER FLOW\nOPTI.',
  'WEB APP\nDESIGN',
  'DESIGN\nSYSTEMS',
  'MOBILE\nDESIGN',
]

const BASE_RADII = [62, 52, 56, 60, 44, 50, 54, 58, 56, 50]

export function initPhysics() {
  const container = document.getElementById('physics-container')
  const world = document.getElementById('physics-world')
  if (!container || !world) return

  let engine, runner, mouseConstraint
  let bodyList = []   // Matter.js bodies (parallel array with domList)
  let domList = []    // DOM elements
  let walls = []
  let observer
  let started = false
  let resizeTimer
  let mouse

  function getWorldSize() {
    return { W: world.offsetWidth || 800, H: world.offsetHeight || 400 }
  }

  function isMobile() { return window.innerWidth <= 600 }
  function sf() { return isMobile() ? 0.7 : 1 }

  function buildWalls(W, H) {
    if (walls.length) walls.forEach(w => Matter.Composite.remove(engine.world, w))
    const t = 60
    walls = [
      Matter.Bodies.rectangle(W / 2, H + t / 2, W + 120, t, { isStatic: true }),
      Matter.Bodies.rectangle(-t / 2, H / 2, t, H * 3, { isStatic: true }),
      Matter.Bodies.rectangle(W + t / 2, H / 2, t, H * 3, { isStatic: true }),
      Matter.Bodies.rectangle(W / 2, -t / 2, W + 120, t, { isStatic: true }),
    ]
    walls.forEach(w => Matter.Composite.add(engine.world, w))
  }

  function spawnCircles(W, H) {
    // Remove old
    if (bodyList.length) bodyList.forEach(b => Matter.Composite.remove(engine.world, b))
    bodyList = []
    domList.forEach(el => el.remove())
    domList = []

    const s = sf()
    const cols = isMobile() ? 3 : 5
    const colW = W / cols

    LABELS.forEach((label, i) => {
      const r = Math.round(BASE_RADII[i] * s)
      const col = i % cols
      const baseX = col * colW + colW * 0.5
      const jitter = (Math.random() - 0.5) * colW * 0.4
      const spawnX = Math.max(r + 4, Math.min(W - r - 4, baseX + jitter))
      const spawnY = -r * 2 - i * 8 - Math.random() * 40

      const delay = i * 70 + Math.random() * 80

      setTimeout(() => {
        if (!engine) return

        const body = Matter.Bodies.circle(spawnX, spawnY, r, {
          restitution: 0.15 + Math.random() * 0.45,
          friction: 0.05,
          frictionAir: 0.02,
          slop: 0.5,
        })
        Matter.Composite.add(engine.world, body)
        bodyList.push(body)

        const el = document.createElement('div')
        el.className = 'physics-circle'
        const d = r * 2
        el.style.cssText = `width:${d}px;height:${d}px;position:absolute;left:0;top:0;margin-left:-${r}px;margin-top:-${r}px;`
        el.textContent = label.replace(/\n/g, ' ')
        el.setAttribute('aria-label', label.replace(/\n/g, ' '))
        world.appendChild(el)
        domList.push(el)
      }, delay)
    })
  }

  function syncDOM() {
    bodyList.forEach((body, i) => {
      const el = domList[i]
      if (!el) return
      const { x, y } = body.position
      const a = body.angle
      el.style.transform = `translate(${x}px,${y}px) rotate(${a}rad)`
    })
  }

  function capVelocities() {
    const MAX = 20
    bodyList.forEach(body => {
      const { x, y } = body.velocity
      const spd = Math.sqrt(x * x + y * y)
      if (spd > MAX) {
        Matter.Body.setVelocity(body, { x: x / spd * MAX, y: y / spd * MAX })
      }
    })
  }

  function startPhysics() {
    if (started) return
    started = true

    const { W, H } = getWorldSize()

    engine = Matter.Engine.create({ gravity: { y: 1 } })
    runner = Matter.Runner.create()

    buildWalls(W, H)
    spawnCircles(W, H)

    // Mouse / touch constraint — no Render needed, just the MouseConstraint
    mouse = Matter.Mouse.create(world)

    // Fix scroll offset
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel)
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel)

    mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    })
    Matter.Composite.add(engine.world, mouseConstraint)

    // Sync DOM every engine tick
    Matter.Events.on(engine, 'afterUpdate', () => {
      capVelocities()
      syncDOM()
    })

    Matter.Runner.run(runner, engine)

    // Forward touch events to the mouse element so Matter.js picks them up
    // Matter.Mouse already listens to its element; we map touches → pointer-style events
    world.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const rect = world.getBoundingClientRect()
      mouse.position.x = t.clientX - rect.left
      mouse.position.y = t.clientY - rect.top
      mouse.button = 0
      // Dispatch a synthetic mousedown so MouseConstraint grabs bodies
      world.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY, bubbles: true }))
    }, { passive: false })

    world.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const t = e.touches[0]
      const rect = world.getBoundingClientRect()
      mouse.position.x = t.clientX - rect.left
      mouse.position.y = t.clientY - rect.top
      world.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY, bubbles: true }))
    }, { passive: false })

    world.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0]
      mouse.button = -1
      world.dispatchEvent(new MouseEvent('mouseup', { clientX: t.clientX, clientY: t.clientY, bubbles: true }))
    }, { passive: true })
  }

  function rebuild() {
    if (!started || !engine) return
    const { W, H } = getWorldSize()
    buildWalls(W, H)
    if (bodyList.length) bodyList.forEach(b => Matter.Composite.remove(engine.world, b))
    bodyList = []
    domList.forEach(el => el.remove())
    domList = []
    spawnCircles(W, H)
  }

  // Static fallback for reduced motion
  if (REDUCED) {
    const s = sf()
    const { W } = getWorldSize()
    let x = 16, y = 80, row = 0
    LABELS.forEach((label, i) => {
      const r = Math.round(BASE_RADII[i] * s)
      if (x + r * 2 + 16 > W) { x = 16; row++ }
      const el = document.createElement('div')
      el.className = 'physics-circle'
      const d = r * 2
      el.style.cssText = `width:${d}px;height:${d}px;position:absolute;left:${x}px;top:${16 + row * (d + 12)}px;`
      el.textContent = label.replace(/\n/g, ' ')
      world.appendChild(el)
      x += r * 2 + 12
    })
    return
  }

  // Lazy-init on scroll into view
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      startPhysics()
      observer.disconnect()
    }
  }, { threshold: 0.1 })
  observer.observe(container)

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(rebuild, 300)
  }, { passive: true })
}
